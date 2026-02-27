'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { callAIAgent } from '@/lib/aiAgent'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
// Skeleton available from @/components/ui/skeleton if needed
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import {
  FiSend, FiMapPin, FiStar, FiDollarSign, FiUser, FiCalendar,
  FiClock, FiChevronDown, FiChevronUp, FiTrash2, FiMessageSquare,
  FiBookmark, FiCompass, FiGlobe, FiMenu, FiX, FiSearch,
  FiArrowRight, FiCheck, FiAlertCircle, FiRefreshCw, FiMap,
  FiChevronRight, FiTrendingUp, FiInfo
} from 'react-icons/fi'
import { HiSparkles } from 'react-icons/hi'
import { BiHotel, BiWalk } from 'react-icons/bi'

// ============================================================
// CONSTANTS
// ============================================================
const AGENT_ID = '69a1a716ceaca7d828c03833'
const STORAGE_KEY = 'travelease_saved_itineraries'

// ============================================================
// INTERFACES
// ============================================================
interface ItineraryDay {
  day: number
  title: string
  activities: string[]
  tips: string
}

interface Hotel {
  name: string
  rating: number
  price_per_night: string
  description: string
  category: string
}

interface Tour {
  name: string
  duration: string
  price: string
  description: string
}

interface CostSummary {
  flights: string
  accommodation: string
  activities: string
  food: string
  total: string
}

interface TravelResponse {
  message: string
  destination: string
  itinerary: ItineraryDay[]
  hotels: Hotel[]
  tours: Tour[]
  cost_summary: CostSummary
}

interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  data?: TravelResponse
  timestamp: Date
}

interface SavedItinerary {
  id: string
  destination: string
  dateRange: string
  budget: string
  travelerType: string
  data: TravelResponse
  savedAt: Date
}

type ViewType = 'home' | 'chat' | 'trips'

// ============================================================
// SAMPLE DATA
// ============================================================
const SAMPLE_RESPONSE: TravelResponse = {
  message: "I'd love to help you plan your trip to Kyoto, Japan! Kyoto is a wonderful destination known for its stunning temples, traditional tea houses, and beautiful cherry blossoms. Here's a personalized itinerary based on your preferences.",
  destination: "Kyoto, Japan",
  itinerary: [
    { day: 1, title: "Arrival & Eastern Kyoto", activities: ["Visit Fushimi Inari Shrine and walk the iconic torii gates", "Explore Kiyomizu-dera Temple", "Evening stroll through Gion district"], tips: "Start early to avoid crowds at Fushimi Inari. Wear comfortable walking shoes." },
    { day: 2, title: "Northern Kyoto & Zen Gardens", activities: ["Visit Kinkaku-ji (Golden Pavilion)", "Explore Ryoan-ji Zen Garden", "Walk through Arashiyama Bamboo Grove", "Enjoy matcha at a traditional tea house"], tips: "The bamboo grove is most magical in early morning light." },
    { day: 3, title: "Cultural Immersion", activities: ["Attend a traditional tea ceremony", "Visit Nijo Castle", "Explore Nishiki Market for local delicacies", "Evening kaiseki dinner experience"], tips: "Book the tea ceremony in advance. Nishiki Market closes around 5 PM." }
  ],
  hotels: [
    { name: "Hotel Kanra Kyoto", rating: 5, price_per_night: "$280", description: "A luxurious boutique hotel blending traditional Japanese aesthetics with modern comfort, located near Kyoto Station.", category: "luxury" },
    { name: "Piece Hostel Sanjo", rating: 4, price_per_night: "$45", description: "A stylish and clean hostel in the heart of downtown Kyoto, perfect for budget-conscious travelers.", category: "budget" },
    { name: "Kyoto Granbell Hotel", rating: 4, price_per_night: "$120", description: "A comfortable mid-range hotel with Japanese-inspired rooms and excellent location near Gion.", category: "mid-range" }
  ],
  tours: [
    { name: "Fushimi Inari Sunrise Tour", duration: "3 hours", price: "$45", description: "Beat the crowds with an early morning guided tour through the iconic vermillion torii gates." },
    { name: "Kyoto Food Walking Tour", duration: "4 hours", price: "$75", description: "Sample street food and local specialties in Nishiki Market and surrounding neighborhoods." },
    { name: "Traditional Tea Ceremony", duration: "1.5 hours", price: "$35", description: "Experience an authentic Japanese tea ceremony in a 200-year-old machiya townhouse." }
  ],
  cost_summary: {
    flights: "$800 - $1,200 (round trip)",
    accommodation: "$135 - $840 (3 nights)",
    activities: "$155 - $250",
    food: "$150 - $300",
    total: "$1,240 - $2,590"
  }
}

const FEATURED_DESTINATIONS = [
  { name: "Kyoto, Japan", price: "From $1,200", category: "Solo", gradient: "from-amber-800 via-amber-700 to-yellow-600" },
  { name: "Santorini, Greece", price: "From $1,800", category: "Luxury", gradient: "from-blue-800 via-blue-600 to-cyan-500" },
  { name: "Bali, Indonesia", price: "From $900", category: "Budget", gradient: "from-green-800 via-emerald-600 to-teal-500" },
  { name: "Swiss Alps", price: "From $2,200", category: "Luxury", gradient: "from-slate-700 via-sky-600 to-blue-400" },
  { name: "Marrakech, Morocco", price: "From $850", category: "Budget", gradient: "from-orange-800 via-red-700 to-amber-600" },
  { name: "Patagonia, Chile", price: "From $1,500", category: "Solo", gradient: "from-indigo-800 via-violet-600 to-purple-500" }
]

const TRENDING_DEALS = [
  { destination: "Tokyo", discount: "25% off", original: "$2,400", now: "$1,800", days: 5 },
  { destination: "Barcelona", discount: "30% off", original: "$1,600", now: "$1,120", days: 4 },
  { destination: "Reykjavik", discount: "20% off", original: "$2,000", now: "$1,600", days: 3 },
  { destination: "Cape Town", discount: "15% off", original: "$1,900", now: "$1,615", days: 6 }
]

const QUICK_PROMPTS = [
  "Budget trip to Bali for 5 days",
  "Luxury Europe tour for 2 weeks",
  "Solo Japan adventure for 7 days",
  "Family beach vacation under $3000"
]

// ============================================================
// ERROR BOUNDARY
// ============================================================
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: string }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props)
    this.state = { hasError: false, error: '' }
  }
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error: error.message }
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
          <div className="text-center p-8 max-w-md">
            <h2 className="text-xl font-semibold mb-2">Something went wrong</h2>
            <p className="text-muted-foreground mb-4 text-sm">{this.state.error}</p>
            <button onClick={() => this.setState({ hasError: false, error: '' })} className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm">Try again</button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}

// ============================================================
// HELPERS
// ============================================================
function renderMarkdown(text: string) {
  if (!text) return null
  return (
    <div className="space-y-1.5">
      {text.split('\n').map((line, i) => {
        if (line.startsWith('### ')) return <h4 key={i} className="font-semibold text-sm mt-3 mb-1">{line.slice(4)}</h4>
        if (line.startsWith('## ')) return <h3 key={i} className="font-semibold text-base mt-3 mb-1">{line.slice(3)}</h3>
        if (line.startsWith('# ')) return <h2 key={i} className="font-bold text-lg mt-4 mb-2">{line.slice(2)}</h2>
        if (line.startsWith('- ') || line.startsWith('* ')) return <li key={i} className="ml-4 list-disc text-sm">{formatInline(line.slice(2))}</li>
        if (/^\d+\.\s/.test(line)) return <li key={i} className="ml-4 list-decimal text-sm">{formatInline(line.replace(/^\d+\.\s/, ''))}</li>
        if (!line.trim()) return <div key={i} className="h-1" />
        return <p key={i} className="text-sm leading-relaxed">{formatInline(line)}</p>
      })}
    </div>
  )
}

function formatInline(text: string) {
  const parts = text.split(/\*\*(.*?)\*\*/g)
  if (parts.length === 1) return text
  return parts.map((part, i) => i % 2 === 1 ? <strong key={i} className="font-semibold">{part}</strong> : part)
}

function generateId() {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
}

function renderStars(rating: number) {
  const stars: React.ReactNode[] = []
  const safeRating = typeof rating === 'number' ? Math.min(Math.max(0, Math.round(rating)), 5) : 0
  for (let i = 0; i < 5; i++) {
    stars.push(
      <FiStar key={i} className={cn("h-3.5 w-3.5", i < safeRating ? "fill-amber-500 text-amber-500" : "text-muted-foreground/30")} />
    )
  }
  return <div className="flex items-center gap-0.5">{stars}</div>
}

function loadSavedItineraries(): SavedItinerary[] {
  if (typeof window === 'undefined') return []
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) return []
    const parsed = JSON.parse(stored)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function saveSavedItineraries(items: SavedItinerary[]) {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
  } catch {
    /* ignore storage quota errors */
  }
}

// ============================================================
// TYPING INDICATOR
// ============================================================
function TypingIndicator() {
  return (
    <div className="flex items-center gap-1.5 px-4 py-3">
      <div className="h-2 w-2 rounded-full bg-primary/60 animate-bounce" />
      <div className="h-2 w-2 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: '0.15s' }} />
      <div className="h-2 w-2 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: '0.3s' }} />
    </div>
  )
}

// ============================================================
// HOTEL CARD
// ============================================================
function HotelCardComponent({ hotel }: { hotel: Hotel }) {
  return (
    <Card className="overflow-hidden border-border/50 hover:shadow-lg transition-all duration-300">
      <div className="h-2 bg-gradient-to-r from-amber-700 via-amber-600 to-yellow-500" />
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-2">
          <div>
            <h4 className="font-serif font-semibold text-sm tracking-wide">{hotel?.name ?? 'Hotel'}</h4>
            {renderStars(hotel?.rating ?? 0)}
          </div>
          <Badge variant="secondary" className="text-xs capitalize">{hotel?.category ?? 'Standard'}</Badge>
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed mb-3">{hotel?.description ?? ''}</p>
        <div className="flex items-center justify-between">
          <span className="font-serif font-bold text-primary text-sm">{hotel?.price_per_night ?? 'N/A'}</span>
          <span className="text-xs text-muted-foreground">per night</span>
        </div>
      </CardContent>
    </Card>
  )
}

// ============================================================
// TOUR CARD
// ============================================================
function TourCardComponent({ tour }: { tour: Tour }) {
  return (
    <Card className="overflow-hidden border-border/50 hover:shadow-lg transition-all duration-300">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="h-10 w-10 rounded-lg bg-accent/20 flex items-center justify-center flex-shrink-0">
            <BiWalk className="h-5 w-5 text-accent" />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-serif font-semibold text-sm tracking-wide">{tour?.name ?? 'Tour'}</h4>
            <p className="text-xs text-muted-foreground leading-relaxed mt-1">{tour?.description ?? ''}</p>
            <div className="flex items-center gap-3 mt-2">
              <span className="flex items-center gap-1 text-xs text-muted-foreground"><FiClock className="h-3 w-3" />{tour?.duration ?? 'N/A'}</span>
              <span className="font-serif font-bold text-primary text-sm">{tour?.price ?? 'N/A'}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// ============================================================
// ITINERARY DAY BLOCK
// ============================================================
function ItineraryDayBlock({ day }: { day: ItineraryDay }) {
  const [expanded, setExpanded] = useState(true)
  const activities = Array.isArray(day?.activities) ? day.activities : []

  return (
    <Card className="overflow-hidden border-border/50">
      <button onClick={() => setExpanded(!expanded)} className="w-full p-4 flex items-center justify-between text-left hover:bg-secondary/30 transition-colors">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-xs font-bold">{day?.day ?? '?'}</div>
          <span className="font-serif font-semibold text-sm tracking-wide">{day?.title ?? `Day ${day?.day ?? '?'}`}</span>
        </div>
        {expanded ? <FiChevronUp className="h-4 w-4 text-muted-foreground" /> : <FiChevronDown className="h-4 w-4 text-muted-foreground" />}
      </button>
      {expanded && (
        <CardContent className="px-4 pb-4 pt-0">
          <ul className="space-y-2 mb-3">
            {activities.map((act, i) => (
              <li key={i} className="flex items-start gap-2 text-sm">
                <FiCheck className="h-4 w-4 text-accent mt-0.5 flex-shrink-0" />
                <span className="leading-relaxed">{act}</span>
              </li>
            ))}
          </ul>
          {day?.tips && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-accent/10 border border-accent/20">
              <FiInfo className="h-4 w-4 text-accent mt-0.5 flex-shrink-0" />
              <p className="text-xs text-muted-foreground leading-relaxed">{day.tips}</p>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  )
}

// ============================================================
// COST SUMMARY CARD
// ============================================================
function CostSummaryCard({ cost }: { cost?: CostSummary }) {
  if (!cost) return null
  const rows = [
    { label: 'Flights', value: cost?.flights },
    { label: 'Accommodation', value: cost?.accommodation },
    { label: 'Activities', value: cost?.activities },
    { label: 'Food', value: cost?.food }
  ]
  return (
    <Card className="border-accent/30 overflow-hidden">
      <div className="h-1 bg-gradient-to-r from-accent via-amber-500 to-accent" />
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-serif flex items-center gap-2"><FiDollarSign className="h-4 w-4 text-accent" />Cost Estimate</CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-2">
          {rows.map((r, i) => (
            <div key={i} className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">{r.label}</span>
              <span className="font-medium">{r.value ?? 'N/A'}</span>
            </div>
          ))}
          <Separator className="my-2" />
          <div className="flex items-center justify-between">
            <span className="font-serif font-bold">Total</span>
            <span className="font-serif font-bold text-primary text-lg">{cost?.total ?? 'N/A'}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// ============================================================
// RICH RESPONSE RENDERER
// ============================================================
function RichResponseCard({ data }: { data: TravelResponse }) {
  const itinerary = Array.isArray(data?.itinerary) ? data.itinerary : []
  const hotels = Array.isArray(data?.hotels) ? data.hotels : []
  const tours = Array.isArray(data?.tours) ? data.tours : []
  const hasCost = data?.cost_summary && typeof data.cost_summary === 'object'

  return (
    <div className="space-y-4 mt-3">
      {itinerary.length > 0 && (
        <div>
          <h4 className="font-serif font-semibold text-sm tracking-wide mb-2 flex items-center gap-2"><FiMap className="h-4 w-4 text-accent" />Itinerary</h4>
          <div className="space-y-2">
            {itinerary.map((d, i) => <ItineraryDayBlock key={i} day={d} />)}
          </div>
        </div>
      )}
      {hotels.length > 0 && (
        <div>
          <h4 className="font-serif font-semibold text-sm tracking-wide mb-2 flex items-center gap-2"><BiHotel className="h-4 w-4 text-accent" />Hotels</h4>
          <div className="grid gap-2">
            {hotels.map((h, i) => <HotelCardComponent key={i} hotel={h} />)}
          </div>
        </div>
      )}
      {tours.length > 0 && (
        <div>
          <h4 className="font-serif font-semibold text-sm tracking-wide mb-2 flex items-center gap-2"><FiCompass className="h-4 w-4 text-accent" />Tours & Activities</h4>
          <div className="grid gap-2">
            {tours.map((t, i) => <TourCardComponent key={i} tour={t} />)}
          </div>
        </div>
      )}
      {hasCost && <CostSummaryCard cost={data.cost_summary} />}
    </div>
  )
}

// ============================================================
// NAVIGATION BAR
// ============================================================
function NavigationBar({ currentView, setView, savedCount }: { currentView: ViewType; setView: (v: ViewType) => void; savedCount: number }) {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <nav className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border/40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <button onClick={() => setView('home')} className="flex items-center gap-2 group">
            <FiGlobe className="h-6 w-6 text-primary group-hover:text-accent transition-colors" />
            <span className="font-serif text-xl font-bold tracking-wide text-foreground">TravelEase</span>
          </button>
          <div className="hidden md:flex items-center gap-6">
            <button onClick={() => setView('home')} className={cn("text-sm font-medium transition-colors", currentView === 'home' ? 'text-primary' : 'text-muted-foreground hover:text-foreground')}>Home</button>
            <button onClick={() => setView('trips')} className={cn("text-sm font-medium transition-colors flex items-center gap-1.5", currentView === 'trips' ? 'text-primary' : 'text-muted-foreground hover:text-foreground')}>
              My Trips
              {savedCount > 0 && <span className="h-5 w-5 rounded-full bg-accent text-accent-foreground text-xs flex items-center justify-center font-bold">{savedCount}</span>}
            </button>
            <Button onClick={() => setView('chat')} size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90 font-serif tracking-wide">
              <HiSparkles className="h-4 w-4 mr-1.5" />Plan My Trip
            </Button>
          </div>
          <button onClick={() => setMobileOpen(!mobileOpen)} className="md:hidden p-2 rounded-lg hover:bg-secondary transition-colors">
            {mobileOpen ? <FiX className="h-5 w-5" /> : <FiMenu className="h-5 w-5" />}
          </button>
        </div>
      </div>
      {mobileOpen && (
        <div className="md:hidden border-t border-border/40 bg-background">
          <div className="px-4 py-3 space-y-2">
            <button onClick={() => { setView('home'); setMobileOpen(false) }} className="block w-full text-left px-3 py-2 rounded-lg text-sm hover:bg-secondary transition-colors">Home</button>
            <button onClick={() => { setView('trips'); setMobileOpen(false) }} className="w-full text-left px-3 py-2 rounded-lg text-sm hover:bg-secondary transition-colors flex items-center gap-2">
              My Trips
              {savedCount > 0 && <span className="h-5 w-5 rounded-full bg-accent text-accent-foreground text-xs flex items-center justify-center font-bold">{savedCount}</span>}
            </button>
            <Button onClick={() => { setView('chat'); setMobileOpen(false) }} className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-serif tracking-wide">
              <HiSparkles className="h-4 w-4 mr-1.5" />Plan My Trip
            </Button>
          </div>
        </div>
      )}
    </nav>
  )
}

// ============================================================
// HOME VIEW
// ============================================================
function HomeView({ setView, setInitialQuery, showSample }: { setView: (v: ViewType) => void; setInitialQuery: (q: string) => void; showSample: boolean }) {
  const [heroQuery, setHeroQuery] = useState('')
  const [filter, setFilter] = useState<string | null>(null)

  const handleHeroSubmit = () => {
    if (!heroQuery.trim()) return
    setInitialQuery(heroQuery.trim())
    setView('chat')
  }

  const handleExplore = (dest: string) => {
    setInitialQuery(`Plan a trip to ${dest}`)
    setView('chat')
  }

  const filteredDestinations = filter
    ? FEATURED_DESTINATIONS.filter(d => d.category === filter)
    : FEATURED_DESTINATIONS

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-accent/5 to-secondary/20" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 lg:py-32">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent/10 border border-accent/20 mb-6">
              <HiSparkles className="h-4 w-4 text-accent" />
              <span className="text-xs font-medium text-accent">AI-Powered Travel Planning</span>
            </div>
            <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-bold tracking-wide leading-tight mb-6">
              Discover Your Perfect Journey
            </h1>
            <p className="text-muted-foreground text-base sm:text-lg leading-relaxed mb-8 max-w-2xl mx-auto">
              Let our AI travel advisor craft personalized itineraries, find the best hotels, and plan unforgettable experiences tailored to your style and budget.
            </p>
            <div className="flex flex-col sm:flex-row items-center gap-3 max-w-xl mx-auto">
              <div className="relative w-full">
                <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  value={heroQuery}
                  onChange={(e) => setHeroQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleHeroSubmit()}
                  placeholder="Where do you want to go?"
                  className="pl-12 pr-4 h-12 text-base bg-card border-border/50 shadow-md rounded-xl focus-visible:ring-accent"
                />
              </div>
              <Button onClick={handleHeroSubmit} size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 font-serif tracking-wide h-12 px-8 rounded-xl shadow-md whitespace-nowrap">
                <FiArrowRight className="h-5 w-5 mr-2" />Plan My Trip
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Filter Chips */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-4 mb-8">
        <div className="flex items-center justify-center gap-3 flex-wrap">
          {[
            { label: 'All', value: null as string | null, icon: FiCompass },
            { label: 'Budget', value: 'Budget' as string | null, icon: FiDollarSign },
            { label: 'Luxury', value: 'Luxury' as string | null, icon: FiStar },
            { label: 'Solo', value: 'Solo' as string | null, icon: FiUser }
          ].map((chip) => {
            const Icon = chip.icon
            const isActive = filter === chip.value
            return (
              <button
                key={chip.label}
                onClick={() => setFilter(chip.value)}
                className={cn("flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 border", isActive ? 'bg-primary text-primary-foreground border-primary shadow-md' : 'bg-card text-muted-foreground border-border/50 hover:border-primary/30 hover:text-foreground')}
              >
                <Icon className="h-4 w-4" />{chip.label}
              </button>
            )
          })}
        </div>
      </section>

      {/* Featured Destinations */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="font-serif text-2xl font-bold tracking-wide">Featured Destinations</h2>
            <p className="text-muted-foreground text-sm mt-1">Curated places for every type of traveler</p>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDestinations.map((dest, i) => (
            <Card key={i} className="group overflow-hidden border-border/30 hover:shadow-xl transition-all duration-300 cursor-pointer" onClick={() => handleExplore(dest.name)}>
              <div className={cn("h-44 bg-gradient-to-br flex items-end p-5 relative", dest.gradient)}>
                <div className="absolute inset-0 bg-black/10 group-hover:bg-black/5 transition-all" />
                <div className="relative z-10">
                  <Badge className="bg-white/20 text-white border-white/30 backdrop-blur-sm text-xs mb-2">{dest.category}</Badge>
                  <h3 className="font-serif text-xl font-bold text-white tracking-wide">{dest.name}</h3>
                </div>
                <div className="absolute top-4 right-4 z-10">
                  <Badge className="bg-white/90 text-foreground border-0 font-serif font-bold shadow-sm">{dest.price}</Badge>
                </div>
              </div>
              <CardFooter className="p-4 flex items-center justify-between">
                <span className="text-sm text-muted-foreground flex items-center gap-1.5"><FiMapPin className="h-3.5 w-3.5" />{dest.name.split(', ')[1] ?? dest.name}</span>
                <span className="text-sm font-medium text-primary flex items-center gap-1 group-hover:gap-2 transition-all">Explore <FiChevronRight className="h-4 w-4" /></span>
              </CardFooter>
            </Card>
          ))}
        </div>
      </section>

      {/* Trending Deals */}
      <section className="bg-secondary/30 border-y border-border/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex items-center gap-2 mb-6">
            <FiTrendingUp className="h-5 w-5 text-accent" />
            <h2 className="font-serif text-2xl font-bold tracking-wide">Trending Deals</h2>
          </div>
          <div className="flex gap-4 overflow-x-auto pb-4 -mx-4 px-4 snap-x">
            {TRENDING_DEALS.map((deal, i) => (
              <Card key={i} className="min-w-[260px] snap-start border-border/30 hover:shadow-lg transition-all duration-300 flex-shrink-0 cursor-pointer" onClick={() => handleExplore(deal.destination)}>
                <CardContent className="p-5">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-serif font-bold text-lg">{deal.destination}</h3>
                    <Badge className="bg-accent/10 text-accent border-accent/20 font-bold">{deal.discount}</Badge>
                  </div>
                  <div className="flex items-center gap-2 text-sm mb-2">
                    <span className="line-through text-muted-foreground">{deal.original}</span>
                    <span className="font-serif font-bold text-primary text-lg">{deal.now}</span>
                  </div>
                  <span className="text-xs text-muted-foreground flex items-center gap-1"><FiCalendar className="h-3 w-3" />{deal.days} days</span>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <FiGlobe className="h-5 w-5 text-primary" />
            <span className="font-serif font-bold tracking-wide">TravelEase</span>
          </div>
          <div className="flex items-center gap-6">
            <button onClick={() => setView('home')} className="text-sm text-muted-foreground hover:text-foreground transition-colors">Home</button>
            <button onClick={() => setView('chat')} className="text-sm text-muted-foreground hover:text-foreground transition-colors">Plan a Trip</button>
            <button onClick={() => setView('trips')} className="text-sm text-muted-foreground hover:text-foreground transition-colors">My Trips</button>
          </div>
          <p className="text-xs text-muted-foreground">TravelEase AI Travel Platform</p>
        </div>
      </footer>
    </div>
  )
}

// ============================================================
// CHAT VIEW
// ============================================================
function ChatView({
  initialQuery,
  clearInitialQuery,
  onSaveItinerary,
  showSample,
  onSetActiveAgent
}: {
  initialQuery: string
  clearInitialQuery: () => void
  onSaveItinerary: (data: TravelResponse) => void
  showSample: boolean
  onSetActiveAgent: (id: string | null) => void
}) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [inputValue, setInputValue] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [sessionId] = useState(() => generateId())
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [lastRetryMsg, setLastRetryMsg] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const initialQueryProcessed = useRef(false)

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages, isLoading, scrollToBottom])

  // Initial welcome message
  useEffect(() => {
    setMessages([{
      id: generateId(),
      role: 'assistant',
      content: "Welcome to TravelEase! I'm your AI Travel Advisor. Tell me about your dream trip -- where would you like to go, when, your budget, and travel style? I'll create a personalized itinerary just for you.",
      timestamp: new Date()
    }])
  }, [])

  const handleSend = useCallback(async (messageText?: string) => {
    const text = (messageText ?? inputValue).trim()
    if (!text || isLoading) return

    setInputValue('')
    setErrorMsg('')
    setLastRetryMsg(text)

    const userMsg: ChatMessage = {
      id: generateId(),
      role: 'user',
      content: text,
      timestamp: new Date()
    }
    setMessages(prev => [...prev, userMsg])
    setIsLoading(true)
    onSetActiveAgent(AGENT_ID)

    try {
      const result = await callAIAgent(text, AGENT_ID, { session_id: sessionId })
      onSetActiveAgent(null)

      if (result.success && result?.response?.result) {
        const agentData = result.response.result as TravelResponse
        const assistantMsg: ChatMessage = {
          id: generateId(),
          role: 'assistant',
          content: agentData?.message ?? result?.response?.message ?? 'Here are your travel recommendations.',
          data: agentData,
          timestamp: new Date()
        }
        setMessages(prev => [...prev, assistantMsg])
      } else {
        const rawFallback = result?.response?.message ?? result?.response?.result?.text ?? result?.error ?? 'I apologize, I was unable to process your request. Please try again.'
        const fallbackText = typeof rawFallback === 'string' ? rawFallback : 'I apologize, I was unable to process your request. Please try again.'
        const assistantMsg: ChatMessage = {
          id: generateId(),
          role: 'assistant',
          content: fallbackText,
          timestamp: new Date()
        }
        setMessages(prev => [...prev, assistantMsg])
        if (result?.error) {
          setErrorMsg(result.error)
        }
      }
    } catch (err) {
      onSetActiveAgent(null)
      const errText = err instanceof Error ? err.message : 'An unexpected error occurred'
      setErrorMsg(errText)
      const assistantMsg: ChatMessage = {
        id: generateId(),
        role: 'assistant',
        content: 'I apologize, something went wrong. Please try again.',
        timestamp: new Date()
      }
      setMessages(prev => [...prev, assistantMsg])
    } finally {
      setIsLoading(false)
    }
  }, [inputValue, isLoading, sessionId, onSetActiveAgent])

  // Process initial query
  useEffect(() => {
    if (initialQuery && !initialQueryProcessed.current) {
      initialQueryProcessed.current = true
      clearInitialQuery()
      const timer = setTimeout(() => {
        handleSend(initialQuery)
      }, 300)
      return () => clearTimeout(timer)
    }
  }, [initialQuery, clearInitialQuery, handleSend])

  // Sample data
  useEffect(() => {
    if (showSample && messages.length <= 1) {
      setMessages(prev => [
        ...prev,
        {
          id: generateId(),
          role: 'user',
          content: 'Plan a 3-day trip to Kyoto, Japan for a solo traveler on a mid-range budget',
          timestamp: new Date()
        },
        {
          id: generateId(),
          role: 'assistant',
          content: SAMPLE_RESPONSE.message,
          data: SAMPLE_RESPONSE,
          timestamp: new Date()
        }
      ])
    }
  }, [showSample, messages.length])

  const handleRetry = () => {
    if (lastRetryMsg) {
      setErrorMsg('')
      handleSend(lastRetryMsg)
    }
  }

  // Get latest travel data for sidebar
  const latestData = [...messages].reverse().find(m => m.data)?.data

  return (
    <div className="flex flex-col lg:flex-row h-[calc(100vh-4rem)]">
      {/* Chat Panel */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Chat Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border/40 bg-card/50">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-full bg-primary flex items-center justify-center">
              <FiCompass className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h3 className="font-serif font-semibold text-sm tracking-wide">Travel Advisor</h3>
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                {isLoading ? (
                  <><span className="h-2 w-2 rounded-full bg-accent animate-pulse inline-block" /> Planning...</>
                ) : (
                  <><span className="h-2 w-2 rounded-full bg-green-500 inline-block" /> Online</>
                )}
              </span>
            </div>
          </div>
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="lg:hidden p-2 rounded-lg hover:bg-secondary transition-colors">
            <FiMap className="h-5 w-5" />
          </button>
        </div>

        {/* Messages */}
        <ScrollArea className="flex-1">
          <div className="p-4 space-y-4 max-w-3xl mx-auto w-full">
            {messages.map((msg) => (
              <div key={msg.id} className={cn("flex", msg.role === 'user' ? 'justify-end' : 'justify-start')}>
                <div className={cn("max-w-[85%] rounded-2xl px-4 py-3", msg.role === 'user' ? 'bg-primary text-primary-foreground rounded-br-md' : 'bg-card border border-border/50 rounded-bl-md shadow-sm')}>
                  <div className="text-sm leading-relaxed">{renderMarkdown(msg.content)}</div>
                  {msg.data && <RichResponseCard data={msg.data} />}
                  <div className={cn("text-[10px] mt-2 opacity-60", msg.role === 'user' ? 'text-right' : 'text-left')}>
                    {msg.timestamp instanceof Date ? msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                  </div>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-card border border-border/50 rounded-2xl rounded-bl-md shadow-sm">
                  <TypingIndicator />
                </div>
              </div>
            )}
            {errorMsg && (
              <div className="flex justify-center">
                <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-destructive/10 border border-destructive/20 text-sm">
                  <FiAlertCircle className="h-4 w-4 text-destructive flex-shrink-0" />
                  <span className="text-destructive text-xs">{errorMsg}</span>
                  <button onClick={handleRetry} className="text-xs font-medium text-destructive hover:underline flex items-center gap-1">
                    <FiRefreshCw className="h-3 w-3" />Retry
                  </button>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        {/* Quick Prompts */}
        {messages.length <= 1 && !isLoading && (
          <div className="px-4 pb-2">
            <div className="flex flex-wrap gap-2 max-w-3xl mx-auto">
              {QUICK_PROMPTS.map((prompt, i) => (
                <button key={i} onClick={() => handleSend(prompt)} className="text-xs px-3 py-1.5 rounded-full bg-secondary border border-border/50 text-muted-foreground hover:text-foreground hover:border-primary/30 transition-all">
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input */}
        <div className="p-4 border-t border-border/40 bg-card/30">
          <div className="flex items-center gap-2 max-w-3xl mx-auto">
            <Input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) handleSend() }}
              placeholder="Tell me about your dream trip..."
              disabled={isLoading}
              className="flex-1 h-11 bg-background border-border/50 rounded-xl focus-visible:ring-accent"
            />
            <Button onClick={() => handleSend()} disabled={isLoading || !inputValue.trim()} size="icon" className="h-11 w-11 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90">
              <FiSend className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Itinerary Sidebar - Desktop */}
      <div className={cn("border-l border-border/40 bg-card/30 flex-shrink-0 overflow-hidden", sidebarOpen ? 'fixed inset-0 z-40 lg:relative lg:w-[360px]' : 'hidden lg:block lg:w-[360px]')}>
        {sidebarOpen && <div className="fixed inset-0 bg-black/30 lg:hidden" onClick={() => setSidebarOpen(false)} />}
        <div className={cn("h-full flex flex-col bg-card/50", sidebarOpen ? 'relative z-50 w-[85vw] max-w-[360px] ml-auto h-screen' : '')}>
          <div className="flex items-center justify-between px-4 py-3 border-b border-border/40">
            <h3 className="font-serif font-semibold text-sm tracking-wide flex items-center gap-2"><FiBookmark className="h-4 w-4 text-accent" />Trip Summary</h3>
            <button onClick={() => setSidebarOpen(false)} className="lg:hidden p-1 rounded-lg hover:bg-secondary"><FiX className="h-4 w-4" /></button>
          </div>
          <ScrollArea className="flex-1">
            <div className="p-4 space-y-4">
              {latestData ? (
                <>
                  {latestData.destination && (
                    <div className="flex items-center gap-2 p-3 rounded-lg bg-primary/5 border border-primary/10">
                      <FiMapPin className="h-5 w-5 text-primary flex-shrink-0" />
                      <div>
                        <span className="text-xs text-muted-foreground">Destination</span>
                        <h4 className="font-serif font-bold tracking-wide">{latestData.destination}</h4>
                      </div>
                    </div>
                  )}
                  {Array.isArray(latestData.itinerary) && latestData.itinerary.length > 0 && (
                    <div>
                      <h4 className="font-serif font-semibold text-xs tracking-wide text-muted-foreground mb-2 uppercase">Overview</h4>
                      <div className="space-y-1.5">
                        {latestData.itinerary.map((d, i) => (
                          <div key={i} className="flex items-center gap-2 text-sm">
                            <span className="h-6 w-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center flex-shrink-0">{d?.day ?? i + 1}</span>
                            <span className="truncate">{d?.title ?? `Day ${d?.day ?? i + 1}`}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {Array.isArray(latestData.hotels) && latestData.hotels.length > 0 && (
                    <div>
                      <h4 className="font-serif font-semibold text-xs tracking-wide text-muted-foreground mb-2 uppercase">Hotels</h4>
                      <div className="space-y-1.5">
                        {latestData.hotels.map((h, i) => (
                          <div key={i} className="flex items-center justify-between text-sm p-2 rounded-lg bg-background/50">
                            <span className="truncate font-medium">{h?.name ?? 'Hotel'}</span>
                            <span className="text-xs text-primary font-serif font-bold flex-shrink-0 ml-2">{h?.price_per_night ?? ''}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {latestData.cost_summary && (
                    <div className="p-3 rounded-lg bg-accent/10 border border-accent/20">
                      <span className="text-xs text-muted-foreground">Estimated Total</span>
                      <div className="font-serif font-bold text-lg text-primary">{latestData.cost_summary?.total ?? 'N/A'}</div>
                    </div>
                  )}
                  <Button onClick={() => onSaveItinerary(latestData)} className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-serif tracking-wide">
                    <FiBookmark className="h-4 w-4 mr-2" />Save Itinerary
                  </Button>
                </>
              ) : (
                <div className="text-center py-12">
                  <FiMap className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
                  <h4 className="font-serif font-semibold text-sm tracking-wide mb-1">No Itinerary Yet</h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">Start a conversation to build your personalized travel plan.</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </div>
      </div>
    </div>
  )
}

// ============================================================
// TRIPS VIEW
// ============================================================
function TripsView({
  savedTrips,
  onDelete,
  onResume,
  showSample
}: {
  savedTrips: SavedItinerary[]
  onDelete: (id: string) => void
  onResume: (dest: string) => void
  showSample: boolean
}) {
  const [search, setSearch] = useState('')
  const [filterType, setFilterType] = useState<string | null>(null)
  const [detailTrip, setDetailTrip] = useState<SavedItinerary | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

  const displayTrips = showSample && savedTrips.length === 0
    ? [{
        id: 'sample-1',
        destination: SAMPLE_RESPONSE.destination,
        dateRange: 'Mar 15 - Mar 18',
        budget: '$1,240 - $2,590',
        travelerType: 'Solo',
        data: SAMPLE_RESPONSE,
        savedAt: new Date()
      }]
    : savedTrips

  const filtered = displayTrips.filter(t => {
    const matchSearch = !search || (t.destination ?? '').toLowerCase().includes(search.toLowerCase())
    const matchType = !filterType || t.travelerType === filterType
    return matchSearch && matchType
  })

  const gradients = [
    'from-amber-800 via-amber-700 to-yellow-600',
    'from-blue-800 via-blue-600 to-cyan-500',
    'from-green-800 via-emerald-600 to-teal-500',
    'from-indigo-800 via-violet-600 to-purple-500',
    'from-orange-800 via-red-700 to-amber-600',
    'from-slate-700 via-sky-600 to-blue-400'
  ]

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="font-serif text-3xl font-bold tracking-wide mb-2">My Trips</h1>
        <p className="text-muted-foreground text-sm">Your saved itineraries and travel plans</p>
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row items-center gap-3 mb-6">
        <div className="relative w-full sm:max-w-sm">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search destinations..." className="pl-10 bg-card border-border/50" />
        </div>
        <div className="flex items-center gap-2">
          {['Solo', 'Budget', 'Luxury'].map(type => (
            <button key={type} onClick={() => setFilterType(filterType === type ? null : type)} className={cn("px-3 py-1.5 rounded-full text-xs font-medium border transition-all", filterType === type ? 'bg-primary text-primary-foreground border-primary' : 'bg-card text-muted-foreground border-border/50 hover:border-primary/30')}>
              {type}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-20">
          <div className="h-20 w-20 rounded-2xl bg-secondary/50 flex items-center justify-center mx-auto mb-6">
            <FiCompass className="h-10 w-10 text-muted-foreground/30" />
          </div>
          <h3 className="font-serif text-xl font-semibold tracking-wide mb-2">No Saved Trips Yet</h3>
          <p className="text-muted-foreground text-sm mb-6 max-w-md mx-auto">Start planning your next adventure and save your itineraries here for easy access.</p>
          <Button onClick={() => onResume('')} className="bg-primary text-primary-foreground hover:bg-primary/90 font-serif tracking-wide">
            <HiSparkles className="h-4 w-4 mr-2" />Start Planning
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((trip, i) => (
            <Card key={trip.id} className="overflow-hidden border-border/30 hover:shadow-xl transition-all duration-300 group">
              <div className={cn("h-36 bg-gradient-to-br flex items-end p-4 relative", gradients[i % gradients.length])}>
                <div className="absolute inset-0 bg-black/10 group-hover:bg-black/5 transition-all" />
                <div className="relative z-10">
                  <Badge className="bg-white/20 text-white border-white/30 backdrop-blur-sm text-xs mb-2">{trip.travelerType ?? 'Trip'}</Badge>
                  <h3 className="font-serif text-lg font-bold text-white tracking-wide">{trip.destination ?? 'Untitled Trip'}</h3>
                </div>
              </div>
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><FiCalendar className="h-3 w-3" />{trip.dateRange ?? 'No date'}</span>
                  <span className="flex items-center gap-1"><FiDollarSign className="h-3 w-3" />{trip.budget ?? 'N/A'}</span>
                </div>
                <div className="text-xs text-muted-foreground">
                  Saved {trip.savedAt ? new Date(trip.savedAt).toLocaleDateString() : 'recently'}
                </div>
              </CardContent>
              <CardFooter className="p-4 pt-0 flex items-center gap-2">
                <Button size="sm" variant="outline" onClick={() => setDetailTrip(trip)} className="flex-1 text-xs">
                  <FiSearch className="h-3 w-3 mr-1" />Details
                </Button>
                <Button size="sm" variant="outline" onClick={() => onResume(trip.destination)} className="flex-1 text-xs">
                  <FiMessageSquare className="h-3 w-3 mr-1" />Resume
                </Button>
                {deleteConfirm === trip.id ? (
                  <div className="flex items-center gap-1">
                    <Button size="sm" variant="destructive" onClick={() => { onDelete(trip.id); setDeleteConfirm(null) }} className="text-xs px-2">
                      <FiCheck className="h-3 w-3" />
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setDeleteConfirm(null)} className="text-xs px-2">
                      <FiX className="h-3 w-3" />
                    </Button>
                  </div>
                ) : (
                  <Button size="sm" variant="ghost" onClick={() => setDeleteConfirm(trip.id)} className="text-xs px-2 text-muted-foreground hover:text-destructive">
                    <FiTrash2 className="h-3 w-3" />
                  </Button>
                )}
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      {/* Detail Dialog */}
      <Dialog open={!!detailTrip} onOpenChange={(open) => { if (!open) setDetailTrip(null) }}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto bg-background">
          <DialogHeader>
            <DialogTitle className="font-serif text-xl tracking-wide flex items-center gap-2">
              <FiMapPin className="h-5 w-5 text-primary" />{detailTrip?.destination ?? 'Trip Details'}
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              {detailTrip?.travelerType ?? ''} trip{detailTrip?.budget ? ` - ${detailTrip.budget}` : ''}
            </DialogDescription>
          </DialogHeader>
          {detailTrip?.data && (
            <div className="mt-4">
              <Tabs defaultValue="itinerary">
                <TabsList className="w-full">
                  <TabsTrigger value="itinerary" className="flex-1">Itinerary</TabsTrigger>
                  <TabsTrigger value="hotels" className="flex-1">Hotels</TabsTrigger>
                  <TabsTrigger value="tours" className="flex-1">Tours</TabsTrigger>
                  <TabsTrigger value="cost" className="flex-1">Cost</TabsTrigger>
                </TabsList>
                <TabsContent value="itinerary" className="mt-4 space-y-3">
                  {Array.isArray(detailTrip.data.itinerary) && detailTrip.data.itinerary.length > 0 ? (
                    detailTrip.data.itinerary.map((d, i) => <ItineraryDayBlock key={i} day={d} />)
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-8">No itinerary data available</p>
                  )}
                </TabsContent>
                <TabsContent value="hotels" className="mt-4 space-y-3">
                  {Array.isArray(detailTrip.data.hotels) && detailTrip.data.hotels.length > 0 ? (
                    detailTrip.data.hotels.map((h, i) => <HotelCardComponent key={i} hotel={h} />)
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-8">No hotel data available</p>
                  )}
                </TabsContent>
                <TabsContent value="tours" className="mt-4 space-y-3">
                  {Array.isArray(detailTrip.data.tours) && detailTrip.data.tours.length > 0 ? (
                    detailTrip.data.tours.map((t, i) => <TourCardComponent key={i} tour={t} />)
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-8">No tour data available</p>
                  )}
                </TabsContent>
                <TabsContent value="cost" className="mt-4">
                  <CostSummaryCard cost={detailTrip.data.cost_summary} />
                </TabsContent>
              </Tabs>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ============================================================
// AGENT STATUS PANEL
// ============================================================
function AgentStatusPanel({ activeAgentId }: { activeAgentId: string | null }) {
  return (
    <div className="fixed bottom-4 left-4 z-40">
      <Card className="border-border/40 shadow-lg bg-card/90 backdrop-blur-sm">
        <CardContent className="p-3 flex items-center gap-3">
          <div className={cn("h-2.5 w-2.5 rounded-full flex-shrink-0", activeAgentId ? 'bg-accent animate-pulse' : 'bg-green-500')} />
          <div className="text-xs">
            <span className="font-medium text-foreground">Travel Advisor</span>
            <span className="text-muted-foreground ml-2">{activeAgentId ? 'Processing...' : 'Ready'}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// ============================================================
// MAIN PAGE EXPORT
// ============================================================
export default function Page() {
  const [currentView, setCurrentView] = useState<ViewType>('home')
  const [initialQuery, setInitialQuery] = useState('')
  const [showSample, setShowSample] = useState(false)
  const [savedTrips, setSavedTrips] = useState<SavedItinerary[]>([])
  const [activeAgentId, setActiveAgentId] = useState<string | null>(null)
  const [saveStatus, setSaveStatus] = useState('')

  // Load saved trips from localStorage
  useEffect(() => {
    setSavedTrips(loadSavedItineraries())
  }, [])

  const handleSaveItinerary = useCallback((data: TravelResponse) => {
    const newTrip: SavedItinerary = {
      id: generateId(),
      destination: data?.destination ?? 'Untitled Trip',
      dateRange: `${Array.isArray(data?.itinerary) ? data.itinerary.length : 0} days`,
      budget: data?.cost_summary?.total ?? 'N/A',
      travelerType: 'Solo',
      data,
      savedAt: new Date()
    }
    setSavedTrips(prev => {
      const updated = [newTrip, ...prev]
      saveSavedItineraries(updated)
      return updated
    })
    setSaveStatus('Itinerary saved successfully!')
    const timer = setTimeout(() => setSaveStatus(''), 3000)
    return () => clearTimeout(timer)
  }, [])

  const handleDeleteTrip = useCallback((id: string) => {
    setSavedTrips(prev => {
      const updated = prev.filter(t => t.id !== id)
      saveSavedItineraries(updated)
      return updated
    })
  }, [])

  const handleResumeChat = useCallback((dest: string) => {
    if (dest) {
      setInitialQuery(`Tell me more about traveling to ${dest}`)
    }
    setCurrentView('chat')
  }, [])

  const clearInitialQuery = useCallback(() => {
    setInitialQuery('')
  }, [])

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-background text-foreground">
        <NavigationBar currentView={currentView} setView={setCurrentView} savedCount={savedTrips.length} />

        {/* Sample Data Toggle */}
        <div className="fixed top-20 right-4 z-40">
          <Card className="border-border/40 shadow-lg bg-card/90 backdrop-blur-sm">
            <CardContent className="p-3 flex items-center gap-3">
              <label htmlFor="sample-toggle" className="text-xs font-medium text-muted-foreground whitespace-nowrap cursor-pointer">Sample Data</label>
              <Switch id="sample-toggle" checked={showSample} onCheckedChange={setShowSample} />
            </CardContent>
          </Card>
        </div>

        {/* Save Status Inline */}
        {saveStatus && (
          <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50">
            <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-accent/10 border border-accent/20 shadow-lg backdrop-blur-sm">
              <FiCheck className="h-4 w-4 text-accent" />
              <span className="text-sm font-medium text-accent">{saveStatus}</span>
            </div>
          </div>
        )}

        {/* Views */}
        {currentView === 'home' && (
          <HomeView setView={setCurrentView} setInitialQuery={setInitialQuery} showSample={showSample} />
        )}
        {currentView === 'chat' && (
          <ChatView
            initialQuery={initialQuery}
            clearInitialQuery={clearInitialQuery}
            onSaveItinerary={handleSaveItinerary}
            showSample={showSample}
            onSetActiveAgent={setActiveAgentId}
          />
        )}
        {currentView === 'trips' && (
          <TripsView
            savedTrips={savedTrips}
            onDelete={handleDeleteTrip}
            onResume={handleResumeChat}
            showSample={showSample}
          />
        )}

        {/* Agent Status */}
        <AgentStatusPanel activeAgentId={activeAgentId} />
      </div>
    </ErrorBoundary>
  )
}
