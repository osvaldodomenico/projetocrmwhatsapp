'use client'

import { useState, useRef } from 'react'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { FileSpreadsheet, CheckCircle, Upload } from 'lucide-react'
import { toast } from 'sonner'

type Props = { open: boolean; onClose: () => void; onSuccess: () => void }

type Preview = {
  headers: string[]
  rows: Record<string, any>[]
  totalRows: number
  suggestedMapping: Record<string, string>
}

const FIELDS = [
  { key: 'firstName', label: 'Primeiro Nome *', required: true },
  { key: 'lastName', label: 'Sobrenome', required: false },
  { key: 'phone', label: 'Telefone *', required: true },
  { key: 'church', label: 'Igreja', required: false },
  { key: 'groupName', label: 'Grupo', required: false },
  { key: 'neighborhood', label: 'Bairro', required: false },
  { key: 'birthDate', label: 'Data de Nascimento', required: false },
]

export function ImportDialog({ open, onClose, onSuccess }: Props) {
  const [step, setStep] = useState<'upload' | 'map' | 'importing' | 'done'>('upload')
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<Preview | null>(null)
  const [mapping, setMapping] = useState<Record<string, string>>({})
  const [progress, setProgress] = useState(0)
  const [result, setResult] = useState<any>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  async function handleFileSelect(f: File) {
    setFile(f)
    const fd = new FormData()
    fd.append('file', f)
    const res = await fetch('/api/imports/preview', { method: 'POST', body: fd })
    const data = await res.json()
    setPreview(data)
    setMapping(data.suggestedMapping ?? {})
    setStep('map')
  }

  async function handleImport() {
    if (!file) return
    setStep('importing')
    setProgress(30)
    const fd = new FormData()
    fd.append('file', file)
    fd.append('mapping', JSON.stringify(mapping))
    setProgress(60)
    const res = await fetch('/api/imports/execute', { method: 'POST', body: fd })
    const data = await res.json()
    setProgress(100)
    setResult(data)
    setStep('done')
    onSuccess()
    toast.success(`Importação: ${data.imported} novos, ${data.updated} atualizados`)
  }

  function handleClose() {
    setStep('upload')
    setFile(null)
    setPreview(null)
    setMapping({})
    setResult(null)
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="bg-slate-800 border-slate-700 text-white max-w-2xl">
        <DialogHeader>
          <DialogTitle>Importar Contatos</DialogTitle>
          <DialogDescription className="text-slate-400">
            Importe planilha Excel ou CSV
          </DialogDescription>
        </DialogHeader>

        {step === 'upload' && (
          <div
            className="border-2 border-dashed border-slate-600 rounded-lg p-12 text-center cursor-pointer hover:border-purple-500 transition-colors"
            onClick={() => fileRef.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault()
              const f = e.dataTransfer.files[0]
              if (f) handleFileSelect(f)
            }}
          >
            <FileSpreadsheet className="h-12 w-12 text-slate-400 mx-auto mb-3" />
            <p className="text-white font-medium">Arraste sua planilha aqui</p>
            <p className="text-slate-400 text-sm mt-1">ou clique para selecionar</p>
            <p className="text-slate-500 text-xs mt-2">XLSX, XLS, CSV</p>
            <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFileSelect(f) }} />
          </div>
        )}

        {step === 'map' && preview && (
          <div className="space-y-4">
            <p className="text-slate-300 text-sm">
              <span className="font-medium text-white">{preview.totalRows}</span> linhas. Mapeie as colunas:
            </p>
            <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
              {FIELDS.map(({ key, label, required }) => (
                <div key={key} className="flex items-center gap-3">
                  <Label className="w-48 text-slate-300 text-sm flex-shrink-0">{label}</Label>
                  <Select value={mapping[key] ?? ''} onValueChange={(v) => setMapping(m => ({ ...m, [key]: v ?? '' }))}>
                    <SelectTrigger className="flex-1 bg-slate-700 border-slate-600 text-slate-200">
                      <SelectValue placeholder="Selecionar coluna..." />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-700 border-slate-600">
                      {!required && <SelectItem value="">— Ignorar —</SelectItem>}
                      {preview.headers.map(h => (
                        <SelectItem key={h} value={h}>{h}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ))}
            </div>
            <div className="flex gap-3 pt-2">
              <Button variant="outline" onClick={() => setStep('upload')} className="border-slate-600 text-slate-300">
                Voltar
              </Button>
              <Button
                onClick={handleImport}
                disabled={!mapping.firstName || !mapping.phone}
                className="flex-1 bg-purple-600 hover:bg-purple-700"
              >
                <Upload className="h-4 w-4 mr-2" />
                Importar {preview.totalRows} contatos
              </Button>
            </div>
          </div>
        )}

        {step === 'importing' && (
          <div className="space-y-4 py-4">
            <p className="text-slate-300 text-center">Importando contatos...</p>
            <Progress value={progress} className="bg-slate-700" />
          </div>
        )}

        {step === 'done' && result && (
          <div className="space-y-4 py-4">
            <div className="flex justify-center">
              <CheckCircle className="h-12 w-12 text-green-400" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Importados', value: result.imported, color: 'text-green-400' },
                { label: 'Atualizados', value: result.updated, color: 'text-blue-400' },
                { label: 'Ignorados', value: result.skipped, color: 'text-slate-400' },
                { label: 'Erros', value: result.errors, color: 'text-red-400' },
              ].map(({ label, value, color }) => (
                <div key={label} className="bg-slate-700/50 rounded-lg p-3 text-center">
                  <p className={`text-2xl font-bold ${color}`}>{value}</p>
                  <p className="text-slate-400 text-sm">{label}</p>
                </div>
              ))}
            </div>
            <Button onClick={handleClose} className="w-full bg-purple-600 hover:bg-purple-700">Fechar</Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
