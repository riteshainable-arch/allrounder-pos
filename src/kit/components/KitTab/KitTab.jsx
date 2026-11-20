import { Box, Tab } from '@mui/material'
import TabList from '@mui/lab/TabList'
import TabContext from '@mui/lab/TabContext'

const KitTab = ({ tabList, onSelectTab, activeTab, height, tabSx = {} }) => {
    const handleChange = (event, newValue) => {
        onSelectTab(newValue)
    }

    return (
        <TabContext value={activeTab}>
            <Box
                sx={{
                    borderBottom: 1,
                    borderColor: 'divider',
                    width: '100%',
                    overflowX: 'auto',
                    overflowY: 'hidden',
                    WebkitOverflowScrolling: 'touch'
                }}
            >
                <TabList
                    onChange={handleChange}
                    variant="scrollable"
                    scrollButtons="auto"
                    allowScrollButtonsMobile
                    aria-label="card navigation"
                    sx={{ minHeight: height }}
                >
                    {tabList.map((tab) => (
                        <Tab key={tab.value} value={tab.value} label={tab.label}
                            sx={{
                                pt: 3,
                                ...tabSx,
                            }}
                        />
                    ))}
                </TabList>
            </Box>
        </TabContext>
    )
}

export default KitTab