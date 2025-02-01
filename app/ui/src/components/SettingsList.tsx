import * as React from 'react'
import { useEffect, useState } from 'react'
import {
  TableBody,
  TableCell,
  TableRow,
  Table,
  TableHeader,
  TableHeaderCell,
  TableCellLayout,
  Button,
  Spinner
} from '@fluentui/react-components'
import { DeleteRegular, SettingsRegular } from '@fluentui/react-icons'
import { Setting } from '../types/setting'
import ErrorMessage from './ErrorMessage'
import SettingDialog from './SettingDialog'
import CustomDialog from './CustomDialog'
import { deleteSetting, getSettings } from '../services/api'

const columns = [
  { columnKey: 'name', label: 'Name' },
  { columnKey: 'value', label: 'Value' },
  { columnKey: 'action', label: 'Action' }
]

const SettingsList: React.FC = () => {
  const [settings, setSettings] = useState<Setting[]>([])
  const [error, setError] = useState('')
  const [openDialog, setOpenDialog] = useState(false)
  const [settingToBeDeleted, setSettingToBeDeleted] = useState('')
  const [loading, setLoading] = useState(true)

  async function fetchSettings() {
    try {
      setLoading(true)
      const data = await getSettings()
      if (data.length === 0) setError('No Settings found.')
      setSettings(data)
    } catch {
      setError('There was an issue retrieving settings.')
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchSettings()
  }, [])

  const handleDeleteConfirmation = async (id: string) => {
    try {
      await deleteSetting(id)
      setSettings((prevSettings) => prevSettings.filter((setting) => setting.id !== id))
      setSettingToBeDeleted('')
    } catch (error) {
      console.error('Error deleting setting:', error)
      setOpenDialog(false)
      setError(`Failed to delete setting! ${error}`)
    }
  }

  function handleDialogclose(): void {
    fetchSettings()
    setOpenDialog(false)
  }

  return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '20px' }}>
      <div style={{ maxWidth: '800px', width: '100%', margin: '20px', marginLeft: '30px' }}>
        <Button
          onClick={() => {
            setOpenDialog(true)
          }}
          appearance="primary"
          style={{ marginBottom: '20px' }}
        >
          Add New Setting
        </Button>
        {error && <ErrorMessage title="Error!" message={error} onClose={() => {setError('')}} />}
        { loading &&
              <div>
                <Spinner style={{ padding: '20px' }} size="large" />
              </div>
            }
        {openDialog && <SettingDialog isOpen={openDialog} onDone={handleDialogclose} />}
        <Table aria-label="Settings Table" style={{ width: '100%' }}>
          <TableHeader>
            <TableRow>
              {columns.map((column) => (
                <TableHeaderCell key={column.columnKey}>{column.label}</TableHeaderCell>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {settings.map((setting) => (
              <TableRow key={setting.name}>
                <TableCell tabIndex={0} role="gridcell">
                  <TableCellLayout media={<SettingsRegular />}>{setting.name}</TableCellLayout>
                </TableCell>
                <TableCell tabIndex={0} role="gridcell">
                  <TableCellLayout>{setting.value}</TableCellLayout>
                </TableCell>
                <TableCell tabIndex={0} role="gridcell">
                  <TableCellLayout>
                    <Button
                      onClick={() => setSettingToBeDeleted(setting.id)}
                      icon={<DeleteRegular />}
                    >
                      Delete
                    </Button>
                  </TableCellLayout>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      {settingToBeDeleted && (
        <CustomDialog
          isOpen={!!settingToBeDeleted}
          title={`Delete Setting '${settings.find((a) => a.id === settingToBeDeleted)?.name}'`}
          message="Are you sure you want to delete this setting?"
          onConfirm={() => handleDeleteConfirmation(settingToBeDeleted)}
          onCancel={() => setSettingToBeDeleted('')}
        />
      )}
    </div>
  )
}

export default SettingsList
