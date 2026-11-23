import { app, shell, BrowserWindow, ipcMain, nativeImage } from 'electron'
import { join } from 'path'
import sqlite3 from 'sqlite3'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import { autoUpdater } from 'electron-updater'
import icon from '../../resources/allrounder_favicon.png?asset'
import { getProductBarcodes } from '../kit/utils/productBarcodes'
import fs from "node:fs";
import path from "node:path";

const APP_NAME = 'AllRounder Payroll'

const logDirectory = () => path.join(app.getPath("userData"), "logs");

const errorLogPath = () =>
  path.join(logDirectory(), "pos-errors.log");

function serializeError(error) {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack,
    };
  }

  return {
    message: String(error),
  };
}

function writeErrorLog(payload = {}) {
  try {
    fs.mkdirSync(logDirectory(), { recursive: true });

    const logEntry = {
      timestamp: new Date().toISOString(),
      appVersion: app.getVersion(),
      process: payload.process || "electron-main",
      type: payload.type || "application-error",
      source: payload.source || "unknown",
      message: payload.message || "",
      error: payload.error || null,
      details: payload.details || null,
    };

    fs.appendFileSync(
      errorLogPath(),
      JSON.stringify(logEntry) + "\n",
      "utf8"
    );
  } catch (error) {
    console.error("Failed to write POS error log:", error);
  }
}

if (process.platform === 'darwin' || process.platform === 'win32') {
  app.setName(APP_NAME)
}

let db = null
let dbReady = false
let dbInitError = null
let dbWriteChain = Promise.resolve()
let mainWindow = null

function sendAppUpdateStatus(status, details = {}) {
  if (!mainWindow || mainWindow.isDestroyed()) {
    return
  }

  mainWindow.webContents.send('app-update:status', { status, ...details })
}

function configureAutoUpdater() {
  if (is.dev || process.platform !== 'win32') {
    return
  }

  autoUpdater.autoDownload = false
  autoUpdater.autoInstallOnAppQuit = false
  autoUpdater.on('checking-for-update', () => sendAppUpdateStatus('checking'))
  autoUpdater.on('update-available', (info) =>
    sendAppUpdateStatus('available', { version: info.version })
  )
  autoUpdater.on('update-not-available', () => sendAppUpdateStatus('not-available'))
  autoUpdater.on('download-progress', (progress) =>
    sendAppUpdateStatus('downloading', { percent: Math.round(progress.percent) })
  )
  autoUpdater.on('update-downloaded', (info) =>
    sendAppUpdateStatus('downloaded', { version: info.version })
  )
  autoUpdater.on('error', (error) => {
    console.error('Application update failed:', error)
    sendAppUpdateStatus('error', { message: error.message })
  })
}

function withDbWriteLock(operation) {
  const run = dbWriteChain.then(() => operation())
  dbWriteChain = run.catch(() => { })
  return run
}

const SQLITE_MAX_VARIABLES = 999
const PRODUCT_BATCH_SIZE = Math.floor(SQLITE_MAX_VARIABLES / 3)
const CUSTOMER_BATCH_SIZE = Math.floor(SQLITE_MAX_VARIABLES / 6)
const STORE_BATCH_SIZE = Math.floor(SQLITE_MAX_VARIABLES / 3)

const parseJsonPayload = (payload, fallback = []) => {
  if (typeof payload === 'string') {
    return JSON.parse(payload)
  }

  return Array.isArray(payload) ? payload : fallback
}

function configureDatabasePerformance() {
  return new Promise((resolve, reject) => {
    if (!db) {
      resolve()
      return
    }

    db.exec(
      `
        PRAGMA journal_mode = WAL;
        PRAGMA synchronous = NORMAL;
        PRAGMA temp_store = MEMORY;
        PRAGMA cache_size = -64000;
      `,
      (error) => {
        if (error) {
          reject(error)
          return
        }

        resolve()
      }
    )
  })
}

function runInTransaction(work) {
  return new Promise((resolve, reject) => {
    db.run('BEGIN IMMEDIATE', (beginErr) => {
      if (beginErr) {
        reject(beginErr)
        return
      }

      work()
        .then((result) => {
          db.run('COMMIT', (commitErr) => {
            if (commitErr) {
              reject(commitErr)
              return
            }

            resolve(result)
          })
        })
        .catch((error) => {
          db.run('ROLLBACK', () => {
            reject(error)
          })
        })
    })
  })
}

function insertRowsInBatches({
  items,
  batchSize,
  buildQuery,
}) {
  return new Promise((resolve, reject) => {
    if (!items.length) {
      resolve({ total: 0 })
      return
    }

    const timestamp = new Date().toISOString()
    let offset = 0

    const insertNextBatch = () => {
      if (offset >= items.length) {
        resolve({ total: items.length })
        return
      }

      const batch = items.slice(offset, offset + batchSize)
      offset += batch.length

      const { sql, values } = buildQuery(batch, timestamp)

      db.run(sql, values, (error) => {
        if (error) {
          reject(error)
          return
        }

        insertNextBatch()
      })
    }

    insertNextBatch()
  })
}

function bulkReplaceProducts(items, { clearFirst = true } = {}) {
  return runInTransaction(async () => {
    if (clearFirst) {
      await new Promise((resolve, reject) => {
        db.run('DELETE FROM products', (error) => {
          if (error) reject(error)
          else resolve()
        })
      })
    }

    return insertRowsInBatches({
      items,
      batchSize: PRODUCT_BATCH_SIZE,
      buildQuery: (batch, timestamp) => {
        const placeholders = batch.map(() => '(?, ?, ?)').join(', ')
        const values = batch.flatMap((product) => [
          product.id,
          JSON.stringify(product),
          timestamp,
        ])

        return {
          sql: `INSERT OR REPLACE INTO products (id, productJson, updatedAt) VALUES ${placeholders}`,
          values,
        }
      },
    })
  })
}

function bulkReplaceStores(items) {
  return runInTransaction(async () => {
    await new Promise((resolve, reject) => {
      db.run('DELETE FROM stores', (error) => {
        if (error) reject(error)
        else resolve()
      })
    })

    return insertRowsInBatches({
      items,
      batchSize: STORE_BATCH_SIZE,
      buildQuery: (batch, timestamp) => {
        const placeholders = batch.map(() => '(?, ?, ?)').join(', ')
        const values = batch.flatMap((store) => [
          store.id,
          JSON.stringify(store),
          timestamp,
        ])

        return {
          sql: `INSERT OR REPLACE INTO stores (id, storeJson, updatedAt) VALUES ${placeholders}`,
          values,
        }
      },
    })
  })
}

function bulkInsertCustomers(items) {
  return runInTransaction(async () => {
    return insertRowsInBatches({
      items,
      batchSize: CUSTOMER_BATCH_SIZE,
      buildQuery: (batch, timestamp) => {
        const placeholders = batch
          .map(() => "(?, ?, ?, ?, ?, ?, ?)")
          .join(", ");

        const values = batch.flatMap((customer) => [
          customer.id,
          customer.firstName ?? "",
          customer.lastName ?? "",
          customer.phone ?? "",
          customer.email ?? null,
          JSON.stringify(customer),
          timestamp,
        ]);

        return {
          sql: `
                        INSERT OR REPLACE INTO customers (
                            id,
                            firstName,
                            lastName,
                            phone,
                            email,
                            customerJson,
                            updatedAt
                        )
                        VALUES ${placeholders}
                    `,
          values,
        };
      },
    });
  });
}

const LEGACY_CASHIER_DEFAULT = {
  id: 3,
  email: "cash@gmail.com",
  name: "Cash",
}

function getTableColumnNames(tableName) {
  return new Promise((resolve, reject) => {
    if (!db) {
      resolve([])
      return
    }

    db.all(`PRAGMA table_info(${tableName})`, [], (err, rows) => {
      if (err) {
        reject(err)
        return
      }

      resolve((rows || []).map((row) => row.name))
    })
  })
}

function migrateBillsIndexNoColumn() {
  return new Promise((resolve, reject) => {
    if (!db) {
      resolve({ updated: 0 })
      return
    }

    getTableColumnNames('bills')
      .then((columns) => {
        if (columns.includes('indexNo')) {
          resolve({ updated: 0 })
          return
        }

        db.serialize(() => {
          db.run(`ALTER TABLE bills ADD COLUMN indexNo TEXT`, (alterErr) => {
            if (alterErr) {
              reject(alterErr)
              return
            }

            db.all(`SELECT id, billJson FROM bills`, [], (selectErr, rows) => {
              if (selectErr) {
                reject(selectErr)
                return
              }

              if (!rows?.length) {
                resolve({ updated: 0 })
                return
              }

              const stmt = db.prepare(`UPDATE bills SET indexNo = ? WHERE id = ?`)
              let updated = 0

              rows.forEach((row) => {
                let indexNo = `LEGACY-${String(row.id).padStart(6, '0')}`

                try {
                  const bill = JSON.parse(row.billJson)
                  indexNo = bill.indexNo || bill.billNumber || indexNo
                } catch (parseError) {
                  console.error(`Failed to parse bill ${row.id} during indexNo migration:`, parseError)
                }

                stmt.run(indexNo, row.id)
                updated += 1
              })

              stmt.finalize((finalizeErr) => {
                if (finalizeErr) {
                  reject(finalizeErr)
                  return
                }

                db.run(
                  `CREATE UNIQUE INDEX IF NOT EXISTS idx_bills_index_no ON bills(indexNo)`,
                  (indexErr) => {
                    if (indexErr) {
                      console.warn('Could not create unique index on bills.indexNo:', indexErr.message)
                    }

                    console.log(`Migrated indexNo column for ${updated} bill(s)`)
                    resolve({ updated })
                  }
                )
              })
            })
          })
        })
      })
      .catch(reject)
  })
}

function migrateLegacyBillsCashier() {
  return new Promise((resolve, reject) => {
    if (!db) {
      resolve({ updated: 0 })
      return
    }

    db.all(`SELECT id, billJson FROM bills`, [], (err, rows) => {
      if (err) {
        reject(err)
        return
      }

      const updates = []

      rows.forEach((row) => {
        try {
          const bill = JSON.parse(row.billJson)

          if (bill.cashierId != null && bill.cashierId !== "") {
            return
          }

          bill.cashierId = LEGACY_CASHIER_DEFAULT.id
          bill.cashierEmail = LEGACY_CASHIER_DEFAULT.email
          if (!bill.cashierName) {
            bill.cashierName = LEGACY_CASHIER_DEFAULT.name
          }

          updates.push({
            id: row.id,
            billJson: JSON.stringify(bill),
          })
        } catch (parseError) {
          console.error(`Failed to parse bill ${row.id}:`, parseError)
        }
      })

      if (!updates.length) {
        resolve({ updated: 0 })
        return
      }

      db.serialize(() => {
        const stmt = db.prepare(`UPDATE bills SET billJson = ? WHERE id = ?`)

        updates.forEach((update) => {
          stmt.run(update.billJson, update.id)
        })

        stmt.finalize((finalizeError) => {
          if (finalizeError) {
            reject(finalizeError)
            return
          }

          console.log(`Migrated ${updates.length} legacy bill(s) to cashier id ${LEGACY_CASHIER_DEFAULT.id}`)
          resolve({ updated: updates.length })
        })
      })
    })
  })
}

function initializeDatabase() {
  return new Promise((resolve, reject) => {
    const dbPath = join(app.getPath('userData'), 'sales.db')

    db = new sqlite3.Database(dbPath, (error) => {
      if (error) {
        reject(error)
        return
      }

      db.serialize(() => {
        // Bills table
        db.run(
          `CREATE TABLE IF NOT EXISTS bills (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            indexNo TEXT NOT NULL UNIQUE,
            billJson TEXT NOT NULL,
            createdAt TEXT
            )`
        );

        // Store table
        db.run(
          `CREATE TABLE IF NOT EXISTS stores (
            id INTEGER PRIMARY KEY,
            storeJson TEXT NOT NULL,
            updatedAt TEXT
           )`
        );

        // Products table
        db.run(`
             CREATE TABLE IF NOT EXISTS products (
              id INTEGER PRIMARY KEY,
              productJson TEXT NOT NULL,
              updatedAt TEXT
             )
          `);

        // Customer Profiles table
        db.run(`
            CREATE TABLE IF NOT EXISTS customer_profiles (
             id INTEGER PRIMARY KEY AUTOINCREMENT,
             phone TEXT UNIQUE,
             profileJson TEXT NOT NULL,
             updatedAt TEXT
            )
          `);

        // Day bill table
        db.run(`
          CREATE TABLE IF NOT EXISTS day_sessions(
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          userId TEXT NOT NULL,
          sessionJson TEXT NOT NULL,
          sessionStatus TEXT NOT NULL,
          createdAt TEXT,
          endedAt TEXT
        )
          `);

        // Last Order Number table
        db.run(`
          CREATE TABLE IF NOT EXISTS counters(
          cashierId INTEGER PRIMARY KEY,
          nextIndexNo INTEGER
        )
          `);

        // Customers table
        db.run(`
        CREATE TABLE IF NOT EXISTS customers (
         id INTEGER PRIMARY KEY,
         firstName TEXT,
         lastName TEXT,
         phone TEXT UNIQUE,
         email TEXT,
         customerJson TEXT,
         updatedAt TEXT
        )
        `, (error) => {
          if (error) {
            reject(error);
            return;
          }

          configureDatabasePerformance()
            .then(() => {
              dbReady = true;
              resolve(dbPath);
            })
            .catch(reject);
        });
      });
    })
  })
}

function setAppIcon() {
  const appIcon = nativeImage.createFromPath(icon)

  if (appIcon.isEmpty()) {
    console.warn('App icon could not be loaded from', icon)
    return
  }

  if (process.platform === 'darwin' && app.dock) {
    app.dock.setIcon(appIcon)
  }
}

function createWindow() {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    fullscreen: true,
    show: false,
    autoHideMenuBar: true,
    title: APP_NAME,
    icon,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
      webSecurity: false
    }
  })

  // Block DevTools shortcuts
  // mainWindow.webContents.on("before-input-event", (event, input) => {
  //   const isDevTools =
  //     input.key === "F12" ||
  //     (input.control && input.shift && input.key.toUpperCase() === "I");

  //   if (isDevTools) {
  //     event.preventDefault();
  //   }
  // });

  // mainWindow.webContents.once("did-finish-load", () => {
  //   mainWindow.webContents.openDevTools();
  // });

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.on('closed', () => {
    mainWindow = null
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

app.commandLine.appendSwitch('no-sandbox')
app.commandLine.appendSwitch('disable-setuid-sandbox')

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(async () => {
  // Set app user model id for windows
  electronApp.setAppUserModelId('com.allrounder.payroll')
  app.setName(APP_NAME)

  setAppIcon()
  configureAutoUpdater()

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  try {
    await initializeDatabase()
    await migrateCustomersCustomerJsonColumn();
    await migrateBillsIndexNoColumn()
    await migrateLegacyBillsCashier()
  } catch (error) {
    dbInitError = error?.message || 'Database initialization failed'
    console.error('Database initialization failed:', error)
  }

  ipcMain.handle('is-database-ready', async () => ({
    ready: Boolean(db && dbReady),
    error: dbInitError,
  }))

  ipcMain.handle('quit-app', () => {
    app.quit()
  })

  ipcMain.handle('app:get-version', () => app.getVersion())
  ipcMain.handle('app:can-update', () => !is.dev && process.platform === 'win32')
  ipcMain.handle('app-update:check', async () => {
    if (is.dev || process.platform !== 'win32') {
      throw new Error('Application updates are available only in the installed Windows app.')
    }

    await autoUpdater.checkForUpdates()
  })
  ipcMain.handle('app-update:download', async () => {
    if (is.dev || process.platform !== 'win32') {
      throw new Error('Application updates are available only in the installed Windows app.')
    }

    await autoUpdater.downloadUpdate()
  })
  ipcMain.handle('app-update:install', () => {
    if (is.dev || process.platform !== 'win32') {
      throw new Error('Application updates are available only in the installed Windows app.')
    }

    autoUpdater.quitAndInstall()
  })

  ipcMain.handle('print-invoice', async () => {
    const printWindow = mainWindow
    if (!printWindow || printWindow.isDestroyed()) {
      throw new Error('The app window is not available for printing.')
    }

    const printers = await printWindow.webContents.getPrintersAsync()
    const defaultPrinter = printers.find((printer) => printer.isDefault)
    if (printers.length === 0) {
      throw new Error('No printers are installed. Connect and install a printer, then try again.')
    }
    const selectedPrinter = defaultPrinter || (printers.length === 1 ? printers[0] : null)

    return new Promise((resolve, reject) => {
      printWindow.webContents.print(
        {
          silent: true,
          printBackground: true,
          ...(selectedPrinter && { deviceName: selectedPrinter.name }),
          margins: { marginType: 'none' },
        },
        (success, failureReason) => {
          if (!success) {
            reject(new Error(failureReason || 'Invoice printing failed.'))
            return
          }

          resolve({ success: true })
        }
      )
    })
  })

  ipcMain.handle("save-bill", async (_, bill) => {
    return withDbWriteLock(async () => {
      if (!bill?.indexNo) {
        throw new Error("Bill index number is required.")
      }

      const billToSave = {
        ...bill,
        billNumber: bill.billNumber ?? bill.indexNo,
      }
      const columns = await getTableColumnNames("bills")
      const insertColumns = ["indexNo"]
      const values = [billToSave.indexNo]

      if (columns.includes("billNumber")) {
        insertColumns.push("billNumber")
        values.push(billToSave.billNumber)
      }

      insertColumns.push("billJson", "createdAt")
      values.push(JSON.stringify(billToSave), new Date().toISOString())

      return new Promise((resolve, reject) => {
        db.run(
          `INSERT INTO bills (${insertColumns.join(", ")})
           VALUES (${insertColumns.map(() => "?").join(", ")})`,
          values,
          function (err) {
            if (err) return reject(err)

            resolve({
              id: this.lastID,
              indexNo: billToSave.indexNo,
            })
          }
        )
      })
    })
  })

  ipcMain.handle("get-bills", async () => {
    return new Promise((resolve, reject) => {
      db.all(
        `SELECT * FROM bills ORDER BY id DESC`,
        [],
        (err, rows) => {
          if (err) return reject(err);

          const bills = rows.map(row => ({
            id: row.id,
            ...JSON.parse(row.billJson)
          }));

          resolve(bills);
        }
      );

    });
  });

  ipcMain.handle("clear-local-data-except-bills", async () => {
    if (!db || !dbReady) {
      throw new Error("Database is not ready. Restart the app and try again.");
    }

    return new Promise((resolve, reject) => {
      db.serialize(() => {
        const clearStatements = [
          "DELETE FROM products",
          "DELETE FROM stores",
          "DELETE FROM customers",
          "DELETE FROM customer_profiles",
          // day_sessions is kept on purpose: it holds today's start-day record (opening cash).
          // Without it End Day / settlement cannot be completed after "Clear DB".
          "DELETE FROM counters",
        ];

        let remaining = clearStatements.length;
        let firstError = null;

        clearStatements.forEach((sql) => {
          db.run(sql, (error) => {
            if (error && !firstError) {
              firstError = error;
            }

            remaining -= 1;
            if (remaining === 0) {
              if (firstError) {
                reject(firstError);
                return;
              }

              resolve({ success: true, cleared: true });
            }
          });
        });
      });
    });
  });

  ipcMain.handle("save-products-chunk", async (_, payload = {}) => {
    return withDbWriteLock(async () => {
      if (!db || !dbReady) {
        throw new Error("Database is not ready. Restart the app and try again.");
      }

      const items = parseJsonPayload(payload.productsJson)
      const result = await bulkReplaceProducts(items, { clearFirst: Boolean(payload.clearFirst) })
      return { success: true, total: result.total }
    })
  });

  ipcMain.handle("save-products", async (_, productsPayload) => {
    return withDbWriteLock(async () => {
      if (!db || !dbReady) {
        throw new Error("Database is not ready. Restart the app and try again.");
      }

      const items = parseJsonPayload(productsPayload)
      const result = await bulkReplaceProducts(items, { clearFirst: true })
      return { success: true, total: result.total }
    })
  });

  ipcMain.handle("get-products", async (_, query = "") => {
    return new Promise((resolve, reject) => {

      db.all(
        `SELECT * FROM products`,
        [],
        (err, rows) => {
          if (err) return reject(err);

          const search = query.trim().toLowerCase();

          const products = rows
            .map((row) => JSON.parse(row.productJson))
            .filter((product) => {
              return (
                product.productName?.toLowerCase().includes(search) ||
                String(product.itemCode ?? product.productCode ?? "").toLowerCase() === search ||
                getProductBarcodes(product).some((barcode) => barcode.includes(search))
              );
            })
            .slice(0, 50);

          resolve(products);
        }
      );

    });
  });

  ipcMain.handle("save-customers", async (_, customersPayload) => {
    return withDbWriteLock(async () => {
      if (!db || !dbReady) {
        throw new Error("Database is not ready. Restart the app and try again.");
      }

      const items = parseJsonPayload(customersPayload)
      const result = await bulkInsertCustomers(items)
      return { success: true, total: result.total }
    })
  });

ipcMain.handle(
    "get-customers",
    async (_, { query = "", gstOnly = false } = {}) => {
        return new Promise((resolve, reject) => {
            const search = `%${query.trim()}%`;

            let sql = `
                SELECT *
                FROM customers
                WHERE 1 = 1
            `;

            const params = [];

            if (gstOnly) {
                sql += `
                    AND customerJson IS NOT NULL
                    AND TRIM(json_extract(customerJson, '$.gstNumber')) != ''
                `;
            }

            if (query.trim()) {
                sql += `
                    AND (
                        phone LIKE ?
                        OR firstName LIKE ?
                        OR lastName LIKE ?
                        OR customerJson LIKE ?
                    )
                `;

                params.push(
                    search,
                    search,
                    search,
                    search
                );
            }

            sql += `
                ORDER BY firstName
                LIMIT 50
            `;

            db.all(sql, params, (err, rows) => {
                if (err) {
                    reject(err);
                    return;
                }

                const customers = rows.map((row) => {
                    try {
                        const parsed = row.customerJson
                            ? JSON.parse(row.customerJson)
                            : {};

                        return {
                            ...row,
                            ...parsed,
                            id: parsed.id ?? row.id,
                            firstName:
                                parsed.firstName ??
                                row.firstName ??
                                "",
                            lastName:
                                parsed.lastName ??
                                row.lastName ??
                                "",
                            phone:
                                parsed.phone ??
                                row.phone ??
                                "",
                            gstNumber:
                                parsed.gstNumber ??
                                "",
                        };
                    } catch {
                        return row;
                    }
                });

                resolve(customers);
            });
        });
    }
);

ipcMain.handle("save-customer", async (_, customer) => {
    return withDbWriteLock(
        async () =>
            new Promise((resolve, reject) => {
                db.run(
                    `
                    INSERT INTO customers (
                        id,
                        firstName,
                        lastName,
                        phone,
                        email,
                        customerJson,
                        updatedAt
                    )
                    VALUES (?, ?, ?, ?, ?, ?, ?)

                    ON CONFLICT(phone)
                    DO UPDATE SET
                        id = excluded.id,
                        firstName = excluded.firstName,
                        lastName = excluded.lastName,
                        email = excluded.email,
                        customerJson = excluded.customerJson,
                        updatedAt = excluded.updatedAt
                    `,
                    [
                        customer.id,
                        customer.firstName ?? "",
                        customer.lastName ?? "",
                        customer.phone ?? "",
                        customer.email ?? null,

                        // FULL CUSTOMER OBJECT
                        JSON.stringify(customer),

                        customer.updatedAt ??
                            new Date().toISOString(),
                    ],
                    function (err) {
                        if (err) {
                            reject(err);
                            return;
                        }

                        resolve({
                            success: true,
                            id: customer.id,
                        });
                    }
                );
            })
    );
});

  ipcMain.handle("save-customer-profiles", async (_, profiles) => {
    return withDbWriteLock(async () => new Promise((resolve, reject) => {
      db.serialize(() => {

        const stmt = db.prepare(`
        INSERT OR IGNORE INTO customer_profiles (
          id,
          phone,
          profileJson,
          updatedAt
        )
        VALUES (?, ?, ?, ?)
      `);

        profiles.forEach(profile => {
          stmt.run(
            profile.customer.id,
            profile.customer.phone,
            JSON.stringify(profile),
            new Date().toISOString()
          );
        });

        stmt.finalize(err => {
          if (err) return reject(err);

          resolve({
            success: true,
            total: profiles.length
          });
        });
      });
    }));
  });

  ipcMain.handle("get-customer-profiles", async (_, query = "") => {
    return new Promise((resolve, reject) => {
      db.all(
        `SELECT * FROM customer_profiles`,
        [],
        (err, rows) => {
          if (err) return reject(err);

          const result = rows
            .map(row => JSON.parse(row.profileJson))
            .filter(profile =>
              profile.customer.phone.includes(query) ||
              profile.customer.firstName
                .toLowerCase()
                .includes(query.toLowerCase())
            );

          resolve(result);
        }
      );
    });
  });

  ipcMain.handle("save-customer-profile", async (_, profile) => {
    return withDbWriteLock(async () => new Promise((resolve, reject) => {

      db.get(
        "SELECT id, profileJson FROM customer_profiles WHERE phone = ?",
        [profile.customer.phone],
        (err, row) => {
          if (err) return reject(err);

          let profileToSave = profile;

          if (row) {
            // Existing customer
            profileToSave = JSON.parse(row.profileJson);

            profileToSave.avgInvoiceValue = profile.avgInvoiceValue ?? profileToSave.avgInvoiceValue ?? 0;
            profileToSave.customer.firstName = profile.customer.firstName;
            profileToSave.customer.updatedAt = new Date().toISOString();
            profileToSave.customer.id = row.id;

            db.run(
              `UPDATE customer_profiles
             SET profileJson = ?, updatedAt = ?
             WHERE id = ?`,
              [
                JSON.stringify(profileToSave),
                new Date().toISOString(),
                row.id
              ],
              (err) => {
                if (err) return reject(err);

                resolve({
                  success: true,
                  profile: profileToSave
                });
              }
            );

          } else {
            // New customer
            db.run(
              `INSERT INTO customer_profiles
             (phone, profileJson, updatedAt)
             VALUES (?, ?, ?)`,
              [
                profile.customer.phone,
                JSON.stringify(profile),
                new Date().toISOString()
              ],
              function (err) {
                if (err) return reject(err);

                profile.customer.id = this.lastID;

                db.run(
                  `UPDATE customer_profiles
                 SET profileJson = ?
                 WHERE id = ?`,
                  [
                    JSON.stringify(profile),
                    this.lastID
                  ],
                  (err) => {
                    if (err) return reject(err);

                    resolve({
                      success: true,
                      profile
                    });
                  }
                );
              }
            );
          }
        }
      );
    }));
  });

  ipcMain.handle("save-stores", async (_, storesPayload) => {
    return withDbWriteLock(async () => {
      if (!db || !dbReady) {
        throw new Error("Database is not ready. Restart the app and try again.");
      }

      const items = parseJsonPayload(storesPayload)
      const result = await bulkReplaceStores(items)
      return { success: true, total: result.total }
    })
  });

  ipcMain.handle("get-stores", async () => {
    return new Promise((resolve, reject) => {
      db.all(
        `SELECT * FROM stores`,
        [],
        (err, rows) => {
          if (err) return reject(err);

          resolve(
            rows.map(row => JSON.parse(row.storeJson))
          );
        }
      );
    });
  });

  ipcMain.handle("save-day-bill", async (_, bill) => {
    return withDbWriteLock(async () => {
      if (!db || !dbReady) {
        throw new Error("Database is not ready. Restart the app and try again.");
      }

      const userId = String(bill.userId ?? "");
      const sessionPayload = { ...bill, userId };

      return new Promise((resolve, reject) => {
        // START DAY
        if (sessionPayload.start && !sessionPayload.end) {
          db.run(
            `INSERT INTO day_sessions (
              userId,
              sessionJson,
              sessionStatus,
              createdAt
          )
          VALUES (?, ?, ?, ?)`,
            [
              userId,
              JSON.stringify(sessionPayload),
              "STARTED",
              new Date().toISOString()
            ],
            function (err) {
              if (err) return reject(err);
              resolve({
                success: true,
                id: this.lastID
              });
            }
          );
          return;
        }

        // END DAY
        db.run(
          `UPDATE day_sessions
         SET
            sessionJson = ?,
            sessionStatus = ?,
            endedAt = ?
         WHERE
            userId = ?
            AND json_extract(sessionJson, '$.date') = ?`,
          [
            JSON.stringify(sessionPayload),
            "ENDED",
            new Date().toISOString(),
            userId,
            sessionPayload.date
          ],
          function (err) {
            if (err) return reject(err);
            resolve({
              success: true,
              changes: this.changes
            });
          }
        );
      });
    })
  });

  ipcMain.handle("get-day-bills", async (_, userId) => {
    if (!db || !dbReady) {
      return [];
    }

    return new Promise((resolve, reject) => {
      db.all(
        `SELECT *
       FROM day_sessions
       WHERE userId = ?
       ORDER BY createdAt DESC`,
        [String(userId ?? "")],
        (err, rows) => {
          if (err) return reject(err);
          resolve(rows.map(row => JSON.parse(row.sessionJson)));
        }
      );
    });
  });

  ipcMain.handle("update-bill-sync-status", async (_, indexNo, syncStatus) => {
    return withDbWriteLock(async () => {
      return new Promise((resolve, reject) => {
        db.get(
          "SELECT id, billJson FROM bills WHERE indexNo = ?",
          [indexNo],
          (err, row) => {
            if (err) return reject(err);

            if (!row) {
              return reject(new Error("Bill not found"));
            }

            const bill = JSON.parse(row.billJson);
            bill.syncStatus = syncStatus;

            db.run(
              `UPDATE bills
             SET billJson = ?
             WHERE indexNo = ?`,
              [JSON.stringify(bill), indexNo],
              function (err) {
                if (err) return reject(err);
                resolve({
                  success: true
                });
              }
            );
          }
        );
      });
    });
  });

  // Edit bill details (name / mobile / GST / payment split): merge the changed fields into the stored bill.
  ipcMain.handle("update-bill-details", async (_, indexNo, patch) => {
    return withDbWriteLock(async () => {
      return new Promise((resolve, reject) => {
        db.get(
          "SELECT id, billJson FROM bills WHERE indexNo = ?",
          [indexNo],
          (err, row) => {
            if (err) return reject(err);
            if (!row) return reject(new Error("Bill not found"));

            const bill = { ...JSON.parse(row.billJson), ...(patch || {}) };
            db.run(
              `UPDATE bills SET billJson = ? WHERE indexNo = ?`,
              [JSON.stringify(bill), indexNo],
              function (updateErr) {
                if (updateErr) return reject(updateErr);
                resolve({ success: true, bill: { id: row.id, ...bill } });
              }
            );
          }
        );
      });
    });
  });

  ipcMain.handle("save-next-index-no", async (_, payload) => {
    const { cashierId, nextIndexNo } = payload;
    return new Promise((resolve, reject) => {
      db.run(
        `
      INSERT INTO counters (cashierId, nextIndexNo)
      VALUES (?, ?)
      ON CONFLICT(cashierId)
      DO UPDATE SET nextIndexNo = excluded.nextIndexNo
      `,
        [cashierId, nextIndexNo],
        function (err) {
          if (err) return reject(err);
          resolve({ success: true });
        }
      );
    });
  });

  ipcMain.handle("get-next-index-no", async (_, cashierId) => {
    return new Promise((resolve, reject) => {
      db.get(
        "SELECT nextIndexNo FROM counters WHERE cashierId=?",
        [cashierId],
        (err, row) => {
          if (err) return reject(err);
          if (!row) {
            return reject(new Error("Counter not initialized"));
          }
          const indexNo = row.nextIndexNo;
          db.run(
            "UPDATE counters SET nextIndexNo=? WHERE cashierId=?",
            [indexNo + 1, cashierId],
            (err) => {
              if (err) return reject(err);
              resolve(String(indexNo));
            }
          );
        }
      );
    });
  });

  function migrateCustomersCustomerJsonColumn() {
    return new Promise((resolve, reject) => {
      getTableColumnNames("customers")
        .then((columns) => {
          if (columns.includes("customerJson")) {
            resolve({ updated: 0 });
            return;
          }

          db.run(
            `ALTER TABLE customers ADD COLUMN customerJson TEXT`,
            (error) => {
              if (error) {
                reject(error);
                return;
              }

              console.log(
                "Added customerJson column to customers table"
              );

              resolve({ updated: 1 });
            }
          );
        })
        .catch(reject);
    });
  }

  ipcMain.handle("logger:write-error", async (_event, payload = {}) => {
    writeErrorLog({
      ...payload,
      process: "renderer",
    });

    return { success: true };
  });

  // IPC test
  ipcMain.on('ping', () => console.log('pong'))

  createWindow()

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// Global Electron error handlers
process.on("uncaughtException", (error) => {
  writeErrorLog({
    type: "uncaughtException",
    error: serializeError(error),
  })

  console.error("Uncaught Electron error:", error)
  app.quit()
})

process.on("unhandledRejection", (reason) => {
  writeErrorLog({
    type: "unhandledRejection",
    error: serializeError(reason),
  })

  console.error("Unhandled Electron rejection:", reason)
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
