"use client"

import { useEffect, useState } from "react"
import { Download, Edit2, Loader2, Plus, RefreshCw, Truck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

interface Supplier {
  id: string
  name: string
  type: string
  baseUrl: string
  enabled: boolean
  syncEnabled: boolean
  markupRate: string
  fixedFee: string
  safetyStock: number
  currency: string
  healthStatus: string
  balance?: string | null
  lastSyncAt?: string | null
  apiKeyMasked?: string | null
  _count?: {
    products: number
    importedProducts: number
  }
}

interface SupplierProduct {
  id: string
  externalProductId: string
  name: string
  costPrice: string
  currency: string
  stock: number
  status: string
  lastSyncAt?: string | null
  importedProduct?: {
    id: string
    name: string
    price: string
    isActive: boolean
  } | null
}

const defaultForm = {
  name: "",
  type: "MMOSTORE247",
  baseUrl: "https://mmostore247.com/api/seller",
  apiKey: "",
  markupRate: "1.30",
  fixedFee: "0",
  safetyStock: "1",
  currency: "USD",
}

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null)
  const [products, setProducts] = useState<SupplierProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [productsLoading, setProductsLoading] = useState(false)
  const [syncingId, setSyncingId] = useState<string | null>(null)
  const [importingId, setImportingId] = useState<string | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null)
  const [formData, setFormData] = useState(defaultForm)

  useEffect(() => {
    fetchSuppliers()
  }, [])

  useEffect(() => {
    if (selectedSupplier) {
      fetchSupplierProducts(selectedSupplier.id)
    }
  }, [selectedSupplier])

  const fetchSuppliers = async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/admin/suppliers")
      const data = await res.json()
      if (res.ok) {
        setSuppliers(data.suppliers || [])
        setSelectedSupplier((current) => current || data.suppliers?.[0] || null)
      }
    } finally {
      setLoading(false)
    }
  }

  const fetchSupplierProducts = async (supplierId: string) => {
    setProductsLoading(true)
    try {
      const res = await fetch(`/api/admin/suppliers/${supplierId}/products`)
      const data = await res.json()
      if (res.ok) setProducts(data.products || [])
    } finally {
      setProductsLoading(false)
    }
  }

  const openCreateDialog = () => {
    setEditingSupplier(null)
    setFormData(defaultForm)
    setDialogOpen(true)
  }

  const openEditDialog = (supplier: Supplier) => {
    setEditingSupplier(supplier)
    setFormData({
      name: supplier.name,
      type: supplier.type,
      baseUrl: supplier.baseUrl,
      apiKey: "",
      markupRate: String(supplier.markupRate),
      fixedFee: String(supplier.fixedFee),
      safetyStock: String(supplier.safetyStock),
      currency: supplier.currency,
    })
    setDialogOpen(true)
  }

  const handleSaveSupplier = async (e: React.FormEvent) => {
    e.preventDefault()
    const payload: Record<string, string> = { ...formData }
    if (editingSupplier && !payload.apiKey) {
      delete payload.apiKey
    }

    const res = await fetch(editingSupplier ? `/api/admin/suppliers/${editingSupplier.id}` : "/api/admin/suppliers", {
      method: editingSupplier ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })

    if (res.ok) {
      setDialogOpen(false)
      setEditingSupplier(null)
      setFormData(defaultForm)
      await fetchSuppliers()
      if (editingSupplier) {
        const updated = await res.json()
        setSelectedSupplier((current) => current?.id === editingSupplier.id ? { ...current, ...updated } : current)
      }
    } else {
      const data = await res.json()
      alert(data.error || "保存货源失败")
    }
  }

  const handleToggleSupplier = async (supplier: Supplier) => {
    await fetch(`/api/admin/suppliers/${supplier.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ enabled: !supplier.enabled }),
    })
    fetchSuppliers()
  }

  const handleSync = async (supplier: Supplier) => {
    setSyncingId(supplier.id)
    try {
      const res = await fetch(`/api/admin/suppliers/${supplier.id}/sync`, { method: "POST" })
      const data = await res.json()
      if (!res.ok) {
        alert(data.error || "同步失败")
        return
      }
      await fetchSuppliers()
      await fetchSupplierProducts(supplier.id)
    } finally {
      setSyncingId(null)
    }
  }

  const handleImport = async (product: SupplierProduct) => {
    setImportingId(product.id)
    try {
      const res = await fetch(`/api/admin/supplier-products/${product.id}/import`, { method: "POST" })
      const data = await res.json()
      if (!res.ok) {
        alert(data.error || "导入失败")
        return
      }
      if (selectedSupplier) await fetchSupplierProducts(selectedSupplier.id)
    } finally {
      setImportingId(null)
    }
  }

  const selectedProducts = selectedSupplier ? products : []

  return (
    <div className="flex h-full flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">货源管理</h1>
          <p className="text-muted-foreground">配置上游 API，同步商品库存，并导入为平台商品</p>
        </div>
        <Button onClick={openCreateDialog}>
          <Plus className="mr-2 h-4 w-4" />
          新增货源
        </Button>
      </div>

      <div className="grid min-h-0 flex-1 gap-6 xl:grid-cols-[380px_1fr]">
        <div className="rounded-md border bg-card text-white overflow-hidden">
          <div className="border-b p-4">
            <h2 className="font-semibold">供应商</h2>
          </div>
          <div className="max-h-full overflow-auto">
            {loading ? (
              <div className="flex h-40 items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : suppliers.length === 0 ? (
              <div className="p-8 text-center text-sm text-muted-foreground">暂无货源，请先新增供应商</div>
            ) : (
              <div className="divide-y">
                {suppliers.map((supplier) => (
                  <button
                    key={supplier.id}
                    type="button"
                    onClick={() => setSelectedSupplier(supplier)}
                    className={`w-full p-4 text-left transition-colors hover:bg-muted/40 ${
                      selectedSupplier?.id === supplier.id ? "bg-muted/50" : ""
                    }`}
                  >
                    <div className="mb-3 flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="truncate text-base font-bold">{supplier.name}</div>
                      <div className="truncate text-xs text-muted-foreground">{supplier.baseUrl}</div>
                        {supplier.apiKeyMasked && (
                          <div className="mt-1 text-[10px] text-muted-foreground">Key {supplier.apiKeyMasked}</div>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={(event) => {
                            event.stopPropagation()
                            openEditDialog(supplier)
                          }}
                          title="编辑货源"
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Switch
                          checked={supplier.enabled}
                          onClick={(event) => event.stopPropagation()}
                          onCheckedChange={() => handleToggleSupplier(supplier)}
                        />
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <Badge variant="outline">{supplier.type}</Badge>
                      <Badge variant={supplier.healthStatus === "HEALTHY" ? "secondary" : "outline"}>
                        {supplier.healthStatus}
                      </Badge>
                      <span className="text-muted-foreground">
                        {supplier._count?.products || 0} 上游 / {supplier._count?.importedProducts || 0} 已导入
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="min-w-0 rounded-md border bg-card text-white flex flex-col overflow-hidden">
          <div className="flex flex-col gap-4 border-b p-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="min-w-0">
              <h2 className="flex items-center gap-2 text-xl font-bold">
                <Truck className="h-5 w-5 text-primary" />
                {selectedSupplier?.name || "选择货源"}
              </h2>
              {selectedSupplier && (
                <p className="mt-1 text-sm text-muted-foreground">
                  加价倍率 {Number(selectedSupplier.markupRate).toFixed(2)} + 固定服务费 {Number(selectedSupplier.fixedFee).toFixed(2)}，安全库存 {selectedSupplier.safetyStock}
                </p>
              )}
            </div>
            {selectedSupplier && (
              <Button onClick={() => handleSync(selectedSupplier)} disabled={syncingId === selectedSupplier.id}>
                {syncingId === selectedSupplier.id ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="mr-2 h-4 w-4" />
                )}
                同步商品
              </Button>
            )}
          </div>

          <div className="flex-1 overflow-auto">
            <Table>
              <TableHeader className="sticky top-0 z-10 bg-card">
                <TableRow>
                  <TableHead>商品</TableHead>
                  <TableHead>成本</TableHead>
                  <TableHead>库存</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead className="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {productsLoading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-40 text-center">
                      <Loader2 className="mx-auto h-6 w-6 animate-spin text-primary" />
                    </TableCell>
                  </TableRow>
                ) : selectedProducts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-40 text-center text-muted-foreground">
                      {selectedSupplier ? "暂无上游商品，点击同步商品" : "请先选择一个货源"}
                    </TableCell>
                  </TableRow>
                ) : (
                  selectedProducts.map((product) => (
                    <TableRow key={product.id}>
                      <TableCell>
                        <div className="max-w-xl">
                          <div className="font-semibold">{product.name}</div>
                          <code className="text-[10px] text-muted-foreground">{product.externalProductId}</code>
                          {product.importedProduct && (
                            <div className="mt-1 text-xs text-primary">
                              已导入：{product.importedProduct.name}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="font-mono">
                        {product.currency} {Number(product.costPrice).toFixed(2)}
                      </TableCell>
                      <TableCell>
                        <Badge variant={product.stock > 0 ? "secondary" : "destructive"}>{product.stock}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{product.status}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          variant={product.importedProduct ? "outline" : "secondary"}
                          disabled={Boolean(product.importedProduct) || importingId === product.id}
                          onClick={() => handleImport(product)}
                        >
                          {importingId === product.id ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : (
                            <Download className="mr-2 h-4 w-4" />
                          )}
                          {product.importedProduct ? "已导入" : "导入"}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingSupplier ? "编辑货源" : "新增货源"}</DialogTitle>
            <DialogDescription>
              {editingSupplier
                ? "API Key 留空表示不修改；填写新 Key 会替换当前密钥。"
                : "第一版支持 MMOStore247，后续供应商沿用同一配置模型。"}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSaveSupplier} className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="name">名称</Label>
              <Input id="name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="baseUrl">API Base URL</Label>
              <Input id="baseUrl" value={formData.baseUrl} onChange={(e) => setFormData({ ...formData, baseUrl: e.target.value })} required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="apiKey">API Key</Label>
              <Input
                id="apiKey"
                type="password"
                value={formData.apiKey}
                onChange={(e) => setFormData({ ...formData, apiKey: e.target.value })}
                placeholder={editingSupplier ? "留空表示不修改" : ""}
              />
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
              <div className="grid gap-2">
                <Label htmlFor="markupRate">加价倍率</Label>
                <Input id="markupRate" type="number" step="0.01" value={formData.markupRate} onChange={(e) => setFormData({ ...formData, markupRate: e.target.value })} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="fixedFee">固定服务费</Label>
                <Input id="fixedFee" type="number" step="0.01" value={formData.fixedFee} onChange={(e) => setFormData({ ...formData, fixedFee: e.target.value })} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="safetyStock">安全库存</Label>
                <Input id="safetyStock" type="number" min="0" value={formData.safetyStock} onChange={(e) => setFormData({ ...formData, safetyStock: e.target.value })} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="currency">币种</Label>
                <Input id="currency" value={formData.currency} onChange={(e) => setFormData({ ...formData, currency: e.target.value.toUpperCase() })} />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>取消</Button>
              <Button type="submit">{editingSupplier ? "保存修改" : "保存货源"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
