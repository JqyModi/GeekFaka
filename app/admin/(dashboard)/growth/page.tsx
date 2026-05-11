"use client"

import { useEffect, useMemo, useState } from "react"
import {
  Edit2,
  FileText,
  Loader2,
  Plus,
  Rocket,
  Target,
  Trash2,
  TrendingUp,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"

interface LinkedProduct {
  id: string
  name: string
  slug?: string | null
}

interface LinkedArticle {
  id: string
  title: string
  slug: string
}

interface Opportunity {
  id: string
  title: string
  slug: string
  stage: string
  status: string
  categoryLabel?: string | null
  audience?: string | null
  demandScore: number
  marginScore: number
  competitionScore: number
  speedScore: number
  confidenceScore: number
  riskLevel: string
  suggestedPrice?: string | null
  monthlyRevenueGoal?: string | null
  targetDailySales?: number | null
  sourceUrl?: string | null
  evidenceSummary?: string | null
  sourcingPlan?: string | null
  keywords?: string | null
  distributionPlan?: string | null
  nextAction?: string | null
  complianceNotes?: string | null
  productId?: string | null
  product?: LinkedProduct | null
  _count?: {
    contentTasks: number
  }
}

interface ContentTask {
  id: string
  title: string
  channel: string
  stage: string
  keyword?: string | null
  draftTitle?: string | null
  draftSummary?: string | null
  publishedUrl?: string | null
  notes?: string | null
  opportunityId?: string | null
  opportunity?: {
    id: string
    title: string
    slug: string
  } | null
  articleId?: string | null
  article?: LinkedArticle | null
}

interface ProductOption {
  id: string
  name: string
  slug?: string | null
}

interface ArticleOption {
  id: string
  title: string
  slug: string
}

interface GrowthTrafficSummary {
  days: number
  summary: {
    events: number
    pageViews: number
    productViews: number
    checkoutOpens: number
    checkoutSubmits: number
    orderCreates: number
    paidOrders: number
    revenue: number
  }
  rows: {
    key: string
    source: string
    campaign: string
    content: string
    pageViews: number
    productViews: number
    checkoutOpens: number
    checkoutSubmits: number
    orderCreates: number
    paidOrders: number
    revenue: number
  }[]
}

const opportunityDefaults = {
  title: "",
  slug: "",
  stage: "DISCOVERY",
  status: "ACTIVE",
  categoryLabel: "",
  audience: "",
  demandScore: "7",
  marginScore: "7",
  competitionScore: "3",
  speedScore: "6",
  confidenceScore: "6",
  riskLevel: "LOW",
  suggestedPrice: "",
  monthlyRevenueGoal: "",
  targetDailySales: "",
  sourceUrl: "",
  evidenceSummary: "",
  sourcingPlan: "",
  keywords: "",
  distributionPlan: "",
  nextAction: "",
  complianceNotes: "",
  productId: "",
}

const taskDefaults = {
  title: "",
  channel: "ARTICLE",
  stage: "TODO",
  keyword: "",
  draftTitle: "",
  draftSummary: "",
  publishedUrl: "",
  notes: "",
  opportunityId: "",
  articleId: "",
}

const channelPlaybooks = [
  {
    channel: "REDNOTE",
    name: "小红书",
    automation: "半自动",
    priority: "P0",
    cadence: "每天 1-2 条",
    publishMode: "生成图文与发布清单，账号登录后由人工确认发布",
    bestOffer: "AI 写真 / 商品图 / 小红书封面提示词",
    landingUrl: "https://faka.minai.eu.org/products/ai-image-prompt-pack-v1?utm_source=rednote&utm_medium=social&utm_campaign=photo_prompts",
    riskNote: "不做批量私信和刷屏；避免夸大收益，内容以案例和教程为主。",
  },
  {
    channel: "ZHIHU",
    name: "知乎",
    automation: "半自动",
    priority: "P1",
    cadence: "每周 2-3 篇",
    publishMode: "生成回答/文章草稿，人工选择问题并确认发布",
    bestOffer: "ChatGPT 内容运营工作流 / AI 数字商品启动包",
    landingUrl: "https://faka.minai.eu.org/products/chatgpt-content-ops-workflow-v1?utm_source=zhihu&utm_medium=community&utm_campaign=content_workflow",
    riskNote: "知乎更适合长文种草，避免短链堆叠和纯广告回答。",
  },
  {
    channel: "PINTEREST",
    name: "Pinterest",
    automation: "可 API 化",
    priority: "P0",
    cadence: "每天 3-5 Pins",
    publishMode: "Business 账号 + Pinterest API 审核后可自动创建 Pin",
    bestOffer: "AI 图片提示词包 / prompt examples",
    landingUrl: "https://faka.minai.eu.org/products/ai-image-prompt-pack-v1?utm_source=pinterest&utm_medium=social&utm_campaign=prompt_pins",
    riskNote: "需要 fresh creative，不能重复刷同一图；API 放量要排队限速。",
  },
  {
    channel: "REDDIT",
    name: "Reddit",
    automation: "低自动",
    priority: "P2",
    cadence: "每周 2-4 次",
    publishMode: "自动找话题和起草回复，发布前必须按 subreddit 规则人工确认",
    bestOffer: "免费样例 + 完整提示词包",
    landingUrl: "https://faka.minai.eu.org/pages/ai-image-prompt-pack-guide?utm_source=reddit&utm_medium=community&utm_campaign=prompt_help",
    riskNote: "Reddit 反广告强，不做跨社区复制粘贴；优先解决问题再软引流。",
  },
  {
    channel: "YOUTUBE",
    name: "YouTube Shorts",
    automation: "可 API 化",
    priority: "P1",
    cadence: "每周 3-5 条",
    publishMode: "素材生成后可通过 YouTube Data API 上传，需频道 OAuth",
    bestOffer: "30 秒演示 prompt 前后效果",
    landingUrl: "https://faka.minai.eu.org/products/ai-image-prompt-pack-v1?utm_source=youtube&utm_medium=shorts&utm_campaign=prompt_demo",
    riskNote: "先做可复用短视频模板；避免搬运和低质 AI 堆量。",
  },
] as const

const getChannelPlaybook = (channel: string) => {
  return channelPlaybooks.find((item) => item.channel === channel)
}

export default function GrowthPage() {
  const [loading, setLoading] = useState(true)
  const [savingOpportunity, setSavingOpportunity] = useState(false)
  const [savingTask, setSavingTask] = useState(false)
  const [opportunities, setOpportunities] = useState<Opportunity[]>([])
  const [tasks, setTasks] = useState<ContentTask[]>([])
  const [products, setProducts] = useState<ProductOption[]>([])
  const [articles, setArticles] = useState<ArticleOption[]>([])
  const [traffic, setTraffic] = useState<GrowthTrafficSummary | null>(null)
  const [isOpportunityOpen, setIsOpportunityOpen] = useState(false)
  const [isTaskOpen, setIsTaskOpen] = useState(false)
  const [editingOpportunity, setEditingOpportunity] = useState<Opportunity | null>(null)
  const [editingTask, setEditingTask] = useState<ContentTask | null>(null)
  const [opportunityForm, setOpportunityForm] = useState(opportunityDefaults)
  const [taskForm, setTaskForm] = useState(taskDefaults)

  useEffect(() => {
    fetchData()
  }, [])

  useEffect(() => {
    if (!editingOpportunity) {
      setOpportunityForm(opportunityDefaults)
      return
    }

    setOpportunityForm({
      title: editingOpportunity.title,
      slug: editingOpportunity.slug,
      stage: editingOpportunity.stage,
      status: editingOpportunity.status,
      categoryLabel: editingOpportunity.categoryLabel || "",
      audience: editingOpportunity.audience || "",
      demandScore: String(editingOpportunity.demandScore || 0),
      marginScore: String(editingOpportunity.marginScore || 0),
      competitionScore: String(editingOpportunity.competitionScore || 0),
      speedScore: String(editingOpportunity.speedScore || 0),
      confidenceScore: String(editingOpportunity.confidenceScore || 0),
      riskLevel: editingOpportunity.riskLevel || "LOW",
      suggestedPrice: editingOpportunity.suggestedPrice || "",
      monthlyRevenueGoal: editingOpportunity.monthlyRevenueGoal || "",
      targetDailySales: editingOpportunity.targetDailySales ? String(editingOpportunity.targetDailySales) : "",
      sourceUrl: editingOpportunity.sourceUrl || "",
      evidenceSummary: editingOpportunity.evidenceSummary || "",
      sourcingPlan: editingOpportunity.sourcingPlan || "",
      keywords: editingOpportunity.keywords || "",
      distributionPlan: editingOpportunity.distributionPlan || "",
      nextAction: editingOpportunity.nextAction || "",
      complianceNotes: editingOpportunity.complianceNotes || "",
      productId: editingOpportunity.productId || "",
    })
  }, [editingOpportunity])

  useEffect(() => {
    if (!editingTask) {
      setTaskForm(taskDefaults)
      return
    }

    setTaskForm({
      title: editingTask.title,
      channel: editingTask.channel,
      stage: editingTask.stage,
      keyword: editingTask.keyword || "",
      draftTitle: editingTask.draftTitle || "",
      draftSummary: editingTask.draftSummary || "",
      publishedUrl: editingTask.publishedUrl || "",
      notes: editingTask.notes || "",
      opportunityId: editingTask.opportunityId || "",
      articleId: editingTask.articleId || "",
    })
  }, [editingTask])

  const stats = useMemo(() => {
    const activeCount = opportunities.filter((item) => item.status === "ACTIVE").length
    const readyCount = opportunities.filter((item) => ["READY", "LISTED"].includes(item.stage)).length
    const pendingTasks = tasks.filter((item) => item.stage !== "PUBLISHED").length
    const revenueTarget = opportunities.reduce((sum, item) => sum + Number(item.monthlyRevenueGoal || 0), 0)

    return {
      activeCount,
      readyCount,
      pendingTasks,
      revenueTarget,
    }
  }, [opportunities, tasks])

  const fetchData = async () => {
    setLoading(true)

    try {
      const [opportunityRes, taskRes, productRes, articleRes, trafficRes] = await Promise.all([
        fetch("/api/admin/opportunities"),
        fetch("/api/admin/content-tasks"),
        fetch("/api/admin/products?page=1&limit=100&categoryId=all"),
        fetch("/api/admin/articles?page=1&limit=100"),
        fetch("/api/admin/growth-events?days=14"),
      ])

      const [opportunityData, taskData, productData, articleData, trafficData] = await Promise.all([
        opportunityRes.json(),
        taskRes.json(),
        productRes.json(),
        articleRes.json(),
        trafficRes.json(),
      ])

      setOpportunities(opportunityData.items || [])
      setTasks(taskData.items || [])
      setProducts((productData.products || []).map((item: ProductOption) => ({
        id: item.id,
        name: item.name,
        slug: item.slug,
      })))
      setArticles((articleData.items || []).map((item: ArticleOption) => ({
        id: item.id,
        title: item.title,
        slug: item.slug,
      })))
      setTraffic(trafficData)
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const openOpportunityDialog = (item?: Opportunity) => {
    setEditingOpportunity(item || null)
    setIsOpportunityOpen(true)
  }

  const openTaskDialog = (item?: ContentTask) => {
    setEditingTask(item || null)
    setIsTaskOpen(true)
  }

  const saveOpportunity = async () => {
    setSavingOpportunity(true)

    try {
      const url = editingOpportunity
        ? `/api/admin/opportunities/${editingOpportunity.id}`
        : "/api/admin/opportunities"
      const method = editingOpportunity ? "PATCH" : "POST"

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(opportunityForm),
      })

      if (res.ok) {
        setIsOpportunityOpen(false)
        setEditingOpportunity(null)
        setOpportunityForm(opportunityDefaults)
        fetchData()
      } else {
        alert("保存选品机会失败")
      }
    } catch (error) {
      console.error(error)
    } finally {
      setSavingOpportunity(false)
    }
  }

  const saveTask = async () => {
    setSavingTask(true)

    try {
      const url = editingTask
        ? `/api/admin/content-tasks/${editingTask.id}`
        : "/api/admin/content-tasks"
      const method = editingTask ? "PATCH" : "POST"

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(taskForm),
      })

      if (res.ok) {
        setIsTaskOpen(false)
        setEditingTask(null)
        setTaskForm(taskDefaults)
        fetchData()
      } else {
        alert("保存内容任务失败")
      }
    } catch (error) {
      console.error(error)
    } finally {
      setSavingTask(false)
    }
  }

  const deleteOpportunity = async (id: string) => {
    if (!confirm("确定要删除这个选品机会吗？")) return

    const res = await fetch(`/api/admin/opportunities/${id}`, { method: "DELETE" })
    if (res.ok) {
      fetchData()
    }
  }

  const deleteTask = async (id: string) => {
    if (!confirm("确定要删除这个内容任务吗？")) return

    const res = await fetch(`/api/admin/content-tasks/${id}`, { method: "DELETE" })
    if (res.ok) {
      fetchData()
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">增长运营</h1>
          <p className="text-muted-foreground">把选品、SEO/GEO 内容、上架和补货动作收拢到同一个工作台</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => openTaskDialog()}>
            <FileText className="mr-2 h-4 w-4" />
            新建内容任务
          </Button>
          <Button onClick={() => openOpportunityDialog()}>
            <Plus className="mr-2 h-4 w-4" />
            新建选品机会
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader className="pb-3">
            <CardDescription>活跃机会</CardDescription>
            <CardTitle className="flex items-center justify-between">
              <span>{stats.activeCount}</span>
              <Rocket className="h-5 w-5 text-primary" />
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>待上架 / 已就绪</CardDescription>
            <CardTitle className="flex items-center justify-between">
              <span>{stats.readyCount}</span>
              <Target className="h-5 w-5 text-emerald-400" />
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>待推进内容任务</CardDescription>
            <CardTitle className="flex items-center justify-between">
              <span>{stats.pendingTasks}</span>
              <FileText className="h-5 w-5 text-amber-400" />
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>机会池月目标</CardDescription>
            <CardTitle className="flex items-center justify-between">
              <span>¥{stats.revenueTarget.toFixed(0)}</span>
              <TrendingUp className="h-5 w-5 text-sky-400" />
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Tabs defaultValue="opportunities" className="space-y-4">
        <TabsList>
          <TabsTrigger value="opportunities">选品机会池</TabsTrigger>
          <TabsTrigger value="tasks">内容任务</TabsTrigger>
          <TabsTrigger value="traffic">流量漏斗</TabsTrigger>
          <TabsTrigger value="channels">外部渠道</TabsTrigger>
        </TabsList>

        <TabsContent value="opportunities">
          <div className="rounded-md border bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>机会</TableHead>
                  <TableHead>阶段</TableHead>
                  <TableHead>评分</TableHead>
                  <TableHead>建议价</TableHead>
                  <TableHead>关联商品</TableHead>
                  <TableHead>下一步</TableHead>
                  <TableHead className="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-32 text-center">
                      <Loader2 className="mx-auto h-6 w-6 animate-spin text-primary" />
                    </TableCell>
                  </TableRow>
                ) : opportunities.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-32 text-center text-muted-foreground">
                      暂无选品机会，先录入第一批候选商品方向
                    </TableCell>
                  </TableRow>
                ) : (
                  opportunities.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="align-top">
                        <div className="space-y-1">
                          <div className="font-semibold text-white">{item.title}</div>
                          <div className="flex flex-wrap gap-2">
                            <Badge variant="secondary">{item.status}</Badge>
                            <Badge variant="outline">{item.riskLevel}</Badge>
                            {item.categoryLabel && <Badge variant="outline">{item.categoryLabel}</Badge>}
                          </div>
                          <div className="text-xs text-muted-foreground">/{item.slug}</div>
                        </div>
                      </TableCell>
                      <TableCell>{item.stage}</TableCell>
                      <TableCell>
                        <div className="space-y-1 text-xs text-muted-foreground">
                          <div>需: {item.demandScore} / 利: {item.marginScore}</div>
                          <div>竞: {item.competitionScore} / 快: {item.speedScore}</div>
                          <div>信心: {item.confidenceScore}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {item.suggestedPrice ? `¥${Number(item.suggestedPrice).toFixed(2)}` : "-"}
                      </TableCell>
                      <TableCell>
                        {item.product ? item.product.name : <span className="text-muted-foreground">未关联</span>}
                      </TableCell>
                      <TableCell className="max-w-[240px]">
                        <div className="line-clamp-3 text-sm text-muted-foreground">
                          {item.nextAction || "待定义"}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="icon" onClick={() => openOpportunityDialog(item)}>
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="text-destructive" onClick={() => deleteOpportunity(item.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="tasks">
          <div className="rounded-md border bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>任务</TableHead>
                  <TableHead>渠道</TableHead>
                  <TableHead>阶段</TableHead>
                  <TableHead>关键词</TableHead>
                  <TableHead>关联机会</TableHead>
                  <TableHead>已发布</TableHead>
                  <TableHead className="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-32 text-center">
                      <Loader2 className="mx-auto h-6 w-6 animate-spin text-primary" />
                    </TableCell>
                  </TableRow>
                ) : tasks.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-32 text-center text-muted-foreground">
                      暂无内容任务，先把教程页、落地页和推广文案排进去
                    </TableCell>
                  </TableRow>
                ) : (
                  tasks.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="align-top">
                        <div className="space-y-1">
                          <div className="font-semibold text-white">{item.title}</div>
                          {item.draftTitle && (
                            <div className="text-xs text-muted-foreground">{item.draftTitle}</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div>{getChannelPlaybook(item.channel)?.name || item.channel}</div>
                          {getChannelPlaybook(item.channel) && (
                            <Badge variant="outline">{getChannelPlaybook(item.channel)?.automation}</Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={item.stage === "PUBLISHED" ? "secondary" : "outline"}>
                          {item.stage}
                        </Badge>
                      </TableCell>
                      <TableCell>{item.keyword || "-"}</TableCell>
                      <TableCell>{item.opportunity?.title || "-"}</TableCell>
                      <TableCell>
                        {item.article ? `/pages/${item.article.slug}` : item.publishedUrl || "-"}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="icon" onClick={() => openTaskDialog(item)}>
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="text-destructive" onClick={() => deleteTask(item.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="traffic" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <Card>
              <CardHeader className="pb-3">
                <CardDescription>近 {traffic?.days || 14} 天页面访问</CardDescription>
                <CardTitle>{traffic?.summary.pageViews || 0}</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardDescription>商品页访问</CardDescription>
                <CardTitle>{traffic?.summary.productViews || 0}</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardDescription>打开购买弹窗</CardDescription>
                <CardTitle>{traffic?.summary.checkoutOpens || 0}</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardDescription>支付订单 / 收入</CardDescription>
                <CardTitle>{traffic?.summary.paidOrders || 0} / ¥{(traffic?.summary.revenue || 0).toFixed(2)}</CardTitle>
              </CardHeader>
            </Card>
          </div>

          <div className="rounded-md border bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>来源</TableHead>
                  <TableHead>Campaign</TableHead>
                  <TableHead>Content</TableHead>
                  <TableHead>页访</TableHead>
                  <TableHead>商品页</TableHead>
                  <TableHead>打开购买</TableHead>
                  <TableHead>提交支付</TableHead>
                  <TableHead>支付订单</TableHead>
                  <TableHead className="text-right">收入</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={9} className="h-32 text-center">
                      <Loader2 className="mx-auto h-6 w-6 animate-spin text-primary" />
                    </TableCell>
                  </TableRow>
                ) : !traffic || traffic.rows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="h-32 text-center text-muted-foreground">
                      暂无站内漏斗事件；部署后新访问会自动进入这里
                    </TableCell>
                  </TableRow>
                ) : (
                  traffic.rows.map((row) => (
                    <TableRow key={row.key}>
                      <TableCell className="font-medium text-white">{row.source}</TableCell>
                      <TableCell>{row.campaign}</TableCell>
                      <TableCell>{row.content}</TableCell>
                      <TableCell>{row.pageViews}</TableCell>
                      <TableCell>{row.productViews}</TableCell>
                      <TableCell>{row.checkoutOpens}</TableCell>
                      <TableCell>{row.checkoutSubmits}</TableCell>
                      <TableCell>{row.paidOrders}</TableCell>
                      <TableCell className="text-right">¥{row.revenue.toFixed(2)}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="channels">
          <div className="grid gap-4 xl:grid-cols-2">
            {channelPlaybooks.map((item) => (
              <Card key={item.channel} className="border-border/70 bg-card">
                <CardHeader>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <CardTitle className="flex items-center gap-2 text-white">
                        {item.name}
                        <Badge variant="outline">{item.priority}</Badge>
                      </CardTitle>
                      <CardDescription>{item.publishMode}</CardDescription>
                    </div>
                    <Badge variant={item.automation === "可 API 化" ? "secondary" : "outline"}>
                      {item.automation}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4 text-sm">
                  <div className="grid gap-3 md:grid-cols-2">
                    <div>
                      <div className="text-xs text-muted-foreground">发布频率</div>
                      <div className="mt-1 text-white">{item.cadence}</div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">主推商品</div>
                      <div className="mt-1 text-white">{item.bestOffer}</div>
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">追踪链接</div>
                    <div className="mt-1 break-all rounded-md border bg-background/60 p-2 font-mono text-xs">
                      {item.landingUrl}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">风控备注</div>
                    <div className="mt-1 text-muted-foreground">{item.riskNote}</div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      <Dialog open={isOpportunityOpen} onOpenChange={setIsOpportunityOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-5xl">
          <DialogHeader>
            <DialogTitle>{editingOpportunity ? "编辑选品机会" : "新建选品机会"}</DialogTitle>
          </DialogHeader>

          <div className="grid gap-6 py-2 md:grid-cols-2">
            <div className="space-y-4">
              <div className="grid gap-2">
                <Label>标题</Label>
                <Input value={opportunityForm.title} onChange={(e) => setOpportunityForm({ ...opportunityForm, title: e.target.value })} />
              </div>
              <div className="grid gap-2">
                <Label>Slug</Label>
                <Input value={opportunityForm.slug} onChange={(e) => setOpportunityForm({ ...opportunityForm, slug: e.target.value })} placeholder="留空则自动生成" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>阶段</Label>
                  <Select value={opportunityForm.stage} onValueChange={(value) => setOpportunityForm({ ...opportunityForm, stage: value })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="DISCOVERY">DISCOVERY</SelectItem>
                      <SelectItem value="VALIDATING">VALIDATING</SelectItem>
                      <SelectItem value="READY">READY</SelectItem>
                      <SelectItem value="LISTED">LISTED</SelectItem>
                      <SelectItem value="RESTOCKING">RESTOCKING</SelectItem>
                      <SelectItem value="RETIRED">RETIRED</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label>状态</Label>
                  <Select value={opportunityForm.status} onValueChange={(value) => setOpportunityForm({ ...opportunityForm, status: value })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ACTIVE">ACTIVE</SelectItem>
                      <SelectItem value="PARKED">PARKED</SelectItem>
                      <SelectItem value="WON">WON</SelectItem>
                      <SelectItem value="LOST">LOST</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>分类标签</Label>
                  <Input value={opportunityForm.categoryLabel} onChange={(e) => setOpportunityForm({ ...opportunityForm, categoryLabel: e.target.value })} placeholder="例如：AI模板 / 简历模板" />
                </div>
                <div className="grid gap-2">
                  <Label>目标人群</Label>
                  <Input value={opportunityForm.audience} onChange={(e) => setOpportunityForm({ ...opportunityForm, audience: e.target.value })} placeholder="例如：独立开发者 / 求职者" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>建议售价</Label>
                  <Input type="number" value={opportunityForm.suggestedPrice} onChange={(e) => setOpportunityForm({ ...opportunityForm, suggestedPrice: e.target.value })} />
                </div>
                <div className="grid gap-2">
                  <Label>月目标收入</Label>
                  <Input type="number" value={opportunityForm.monthlyRevenueGoal} onChange={(e) => setOpportunityForm({ ...opportunityForm, monthlyRevenueGoal: e.target.value })} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>日销量目标</Label>
                  <Input type="number" value={opportunityForm.targetDailySales} onChange={(e) => setOpportunityForm({ ...opportunityForm, targetDailySales: e.target.value })} />
                </div>
                <div className="grid gap-2">
                  <Label>风险等级</Label>
                  <Select value={opportunityForm.riskLevel} onValueChange={(value) => setOpportunityForm({ ...opportunityForm, riskLevel: value })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="LOW">LOW</SelectItem>
                      <SelectItem value="MEDIUM">MEDIUM</SelectItem>
                      <SelectItem value="HIGH">HIGH</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid gap-2">
                <Label>关联商品</Label>
                <Select value={opportunityForm.productId || "none"} onValueChange={(value) => setOpportunityForm({ ...opportunityForm, productId: value === "none" ? "" : value })}>
                  <SelectTrigger><SelectValue placeholder="未关联" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">未关联</SelectItem>
                    {products.map((product) => (
                      <SelectItem key={product.id} value={product.id}>
                        {product.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>数据来源</Label>
                <Input value={opportunityForm.sourceUrl} onChange={(e) => setOpportunityForm({ ...opportunityForm, sourceUrl: e.target.value })} placeholder="https://..." />
              </div>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>需求分</Label>
                  <Input type="number" min="0" max="10" value={opportunityForm.demandScore} onChange={(e) => setOpportunityForm({ ...opportunityForm, demandScore: e.target.value })} />
                </div>
                <div className="grid gap-2">
                  <Label>利润分</Label>
                  <Input type="number" min="0" max="10" value={opportunityForm.marginScore} onChange={(e) => setOpportunityForm({ ...opportunityForm, marginScore: e.target.value })} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>竞争分</Label>
                  <Input type="number" min="0" max="10" value={opportunityForm.competitionScore} onChange={(e) => setOpportunityForm({ ...opportunityForm, competitionScore: e.target.value })} />
                </div>
                <div className="grid gap-2">
                  <Label>启动速度分</Label>
                  <Input type="number" min="0" max="10" value={opportunityForm.speedScore} onChange={(e) => setOpportunityForm({ ...opportunityForm, speedScore: e.target.value })} />
                </div>
              </div>
              <div className="grid gap-2">
                <Label>信心分</Label>
                <Input type="number" min="0" max="10" value={opportunityForm.confidenceScore} onChange={(e) => setOpportunityForm({ ...opportunityForm, confidenceScore: e.target.value })} />
              </div>
              <div className="grid gap-2">
                <Label>需求证据</Label>
                <Textarea value={opportunityForm.evidenceSummary} onChange={(e) => setOpportunityForm({ ...opportunityForm, evidenceSummary: e.target.value })} className="min-h-[92px]" placeholder="记录搜索趋势、市场信号和竞品观察" />
              </div>
              <div className="grid gap-2">
                <Label>关键词簇</Label>
                <Textarea value={opportunityForm.keywords} onChange={(e) => setOpportunityForm({ ...opportunityForm, keywords: e.target.value })} className="min-h-[92px]" placeholder="每行或逗号分隔" />
              </div>
              <div className="grid gap-2">
                <Label>上架 / 分发计划</Label>
                <Textarea value={opportunityForm.distributionPlan} onChange={(e) => setOpportunityForm({ ...opportunityForm, distributionPlan: e.target.value })} className="min-h-[92px]" placeholder="SEO、GEO、社媒、社区、联盟等渠道动作" />
              </div>
              <div className="grid gap-2">
                <Label>供货 / 交付方案</Label>
                <Textarea value={opportunityForm.sourcingPlan} onChange={(e) => setOpportunityForm({ ...opportunityForm, sourcingPlan: e.target.value })} className="min-h-[92px]" placeholder="自有内容、授权分销、补货节奏、交付形态" />
              </div>
              <div className="grid gap-2">
                <Label>下一步动作</Label>
                <Textarea value={opportunityForm.nextAction} onChange={(e) => setOpportunityForm({ ...opportunityForm, nextAction: e.target.value })} className="min-h-[72px]" />
              </div>
              <div className="grid gap-2">
                <Label>合规备注</Label>
                <Textarea value={opportunityForm.complianceNotes} onChange={(e) => setOpportunityForm({ ...opportunityForm, complianceNotes: e.target.value })} className="min-h-[72px]" placeholder="授权、版权、品牌或平台规则注意事项" />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsOpportunityOpen(false)}>取消</Button>
            <Button onClick={saveOpportunity} disabled={savingOpportunity}>
              {savingOpportunity && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              保存机会
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isTaskOpen} onOpenChange={setIsTaskOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>{editingTask ? "编辑内容任务" : "新建内容任务"}</DialogTitle>
          </DialogHeader>

          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label>任务名称</Label>
              <Input value={taskForm.title} onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })} />
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="grid gap-2">
                <Label>渠道</Label>
                <Select value={taskForm.channel} onValueChange={(value) => setTaskForm({ ...taskForm, channel: value })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ARTICLE">ARTICLE</SelectItem>
                    <SelectItem value="SEO_PAGE">SEO_PAGE</SelectItem>
                    <SelectItem value="GEO">GEO</SelectItem>
                    <SelectItem value="PINTEREST">PINTEREST</SelectItem>
                    <SelectItem value="YOUTUBE">YOUTUBE</SelectItem>
                    <SelectItem value="REDNOTE">REDNOTE</SelectItem>
                    <SelectItem value="ZHIHU">ZHIHU</SelectItem>
                    <SelectItem value="REDDIT">REDDIT</SelectItem>
                    <SelectItem value="EMAIL">EMAIL</SelectItem>
                    <SelectItem value="COMMUNITY">COMMUNITY</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>阶段</Label>
                <Select value={taskForm.stage} onValueChange={(value) => setTaskForm({ ...taskForm, stage: value })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="TODO">TODO</SelectItem>
                    <SelectItem value="DRAFT">DRAFT</SelectItem>
                    <SelectItem value="READY">READY</SelectItem>
                    <SelectItem value="PUBLISHED">PUBLISHED</SelectItem>
                    <SelectItem value="PAUSED">PAUSED</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid gap-2">
              <Label>关键词</Label>
              <Input value={taskForm.keyword} onChange={(e) => setTaskForm({ ...taskForm, keyword: e.target.value })} />
            </div>
            <div className="grid gap-2">
              <Label>草稿标题</Label>
              <Input value={taskForm.draftTitle} onChange={(e) => setTaskForm({ ...taskForm, draftTitle: e.target.value })} />
            </div>
            <div className="grid gap-2">
              <Label>草稿摘要 / brief</Label>
              <Textarea value={taskForm.draftSummary} onChange={(e) => setTaskForm({ ...taskForm, draftSummary: e.target.value })} className="min-h-[92px]" />
            </div>
            <div className="grid gap-2">
              <Label>发布链接</Label>
              <Input value={taskForm.publishedUrl} onChange={(e) => setTaskForm({ ...taskForm, publishedUrl: e.target.value })} placeholder="https://..." />
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="grid gap-2">
                <Label>关联机会</Label>
                <Select value={taskForm.opportunityId || "none"} onValueChange={(value) => setTaskForm({ ...taskForm, opportunityId: value === "none" ? "" : value })}>
                  <SelectTrigger><SelectValue placeholder="未关联" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">未关联</SelectItem>
                    {opportunities.map((item) => (
                      <SelectItem key={item.id} value={item.id}>
                        {item.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>关联文章</Label>
                <Select value={taskForm.articleId || "none"} onValueChange={(value) => setTaskForm({ ...taskForm, articleId: value === "none" ? "" : value })}>
                  <SelectTrigger><SelectValue placeholder="未关联" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">未关联</SelectItem>
                    {articles.map((item) => (
                      <SelectItem key={item.id} value={item.id}>
                        {item.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid gap-2">
              <Label>备注</Label>
              <Textarea value={taskForm.notes} onChange={(e) => setTaskForm({ ...taskForm, notes: e.target.value })} className="min-h-[92px]" />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsTaskOpen(false)}>取消</Button>
            <Button onClick={saveTask} disabled={savingTask}>
              {savingTask && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              保存任务
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
