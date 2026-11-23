import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

// Custom APIs for renderer
const api = {
  saveBill: (bill) => ipcRenderer.invoke('save-bill', bill),
  getBills: () => ipcRenderer.invoke("get-bills"),
  clearLocalDataExceptBills: () => ipcRenderer.invoke("clear-local-data-except-bills"),
  saveProducts: (products) => ipcRenderer.invoke("save-products", JSON.stringify(products)),
  saveProductsChunk: (payload) => ipcRenderer.invoke("save-products-chunk", payload),
  getProducts: (query) => ipcRenderer.invoke("get-products", query),
  saveCustomers: (customers) => ipcRenderer.invoke("save-customers", JSON.stringify(customers)),
  // getCustomers: (query) => ipcRenderer.invoke("get-customers", query),
  getCustomers: (query = "", gstOnly = false) => ipcRenderer.invoke("get-customers", {query, gstOnly}),
  saveCustomer: (customer) => ipcRenderer.invoke("save-customer", customer),
  saveCustomerProfiles: (profiles) => ipcRenderer.invoke("save-customer-profiles", profiles),
  getCustomerProfiles: (query) => ipcRenderer.invoke("get-customer-profiles", query),
  saveCustomerProfile: (profile) => ipcRenderer.invoke("save-customer-profile", profile),
  saveStores: (stores) => ipcRenderer.invoke("save-stores", JSON.stringify(stores)),
  getStores: () => ipcRenderer.invoke("get-stores"),
  saveDayBill: (session) => ipcRenderer.invoke("save-day-bill", session),
  getDayBills: (userId) => ipcRenderer.invoke("get-day-bills", userId),
  isDatabaseReady: () => ipcRenderer.invoke("is-database-ready"),
  updateBillSyncStatus: (indexNo, syncStatus) => ipcRenderer.invoke("update-bill-sync-status", indexNo, syncStatus),
  updateBillDetails: (indexNo, patch) => ipcRenderer.invoke("update-bill-details", indexNo, patch),
  saveNextIndexNo: (payload) => ipcRenderer.invoke("save-next-index-no", payload),
  getNextIndexNo: (cashierId) => ipcRenderer.invoke("get-next-index-no", cashierId),
  printInvoice: () => ipcRenderer.invoke("print-invoice"),
  printSrn: (payload) => ipcRenderer.invoke("print-srn", payload),
  logError: (payload) => ipcRenderer.invoke("logger:write-error", payload),
  quitApp: () => ipcRenderer.invoke("quit-app"),
  getAppVersion: () => ipcRenderer.invoke("app:get-version"),
  canUpdateApp: () => ipcRenderer.invoke("app:can-update"),
  checkForAppUpdates: () => ipcRenderer.invoke("app-update:check"),
  downloadAppUpdate: () => ipcRenderer.invoke("app-update:download"),
  installAppUpdate: () => ipcRenderer.invoke("app-update:install"),
  onAppUpdateStatus: (callback) => {
    const handler = (_event, status) => callback(status)
    ipcRenderer.on("app-update:status", handler)
    return () => ipcRenderer.removeListener("app-update:status", handler)
  },
}

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
  } catch (error) {
    console.error('Failed to expose electron API:', error)
  }

  try {
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error('Failed to expose api:', error)
  }
} else {
  window.electron = electronAPI
  window.api = api
}
