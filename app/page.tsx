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
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import {
  FiSend, FiMapPin, FiStar, FiDollarSign, FiUser, FiCalendar,
  FiClock, FiChevronDown, FiChevronUp, FiTrash2, FiMessageSquare,
  FiBookmark, FiCompass, FiGlobe, FiMenu, FiX, FiSearch,
  FiArrowRight, FiCheck, FiAlertCircle, FiRefreshCw, FiMap,
  FiChevronRight, FiTrendingUp, FiInfo, FiSun, FiTwitter,
  FiInstagram, FiYoutube, FiHeart, FiShield, FiMail,
  FiAward, FiNavigation, FiSunrise, FiCoffee, FiCamera
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
  { name: "Kyoto, Japan", price: "From $1,200", category: "Solo", gradient: "from-pink-900 via-rose-700 to-amber-500", tagline: "Ancient temples & zen gardens", icon: FiSunrise },
  { name: "Santorini, Greece", price: "From $1,800", category: "Luxury", gradient: "from-blue-900 via-blue-500 to-sky-300", tagline: "White-washed cliffs & sunsets", icon: FiSun },
  { name: "Bali, Indonesia", price: "From $900", category: "Budget", gradient: "from-emerald-900 via-green-600 to-teal-400", tagline: "Lush jungles & sacred temples", icon: FiCoffee },
  { name: "Swiss Alps", price: "From $2,200", category: "Luxury", gradient: "from-slate-800 via-blue-600 to-sky-200", tagline: "Majestic peaks & alpine villages", icon: FiNavigation },
  { name: "Marrakech, Morocco", price: "From $850", category: "Budget", gradient: "from-orange-900 via-red-700 to-amber-500", tagline: "Vibrant souks & spice markets", icon: FiCompass },
  { name: "Patagonia, Chile", price: "From $1,500", category: "Solo", gradient: "from-violet-900 via-purple-600 to-indigo-400", tagline: "Dramatic fjords & glaciers", icon: FiCamera }
]

const TRENDING_DEALS = [
  { destination: "Tokyo", discount: "25% off", original: "$2,400", now: "$1,800", days: 5, gradient: "from-red-800 via-rose-600 to-pink-400" },
  { destination: "Barcelona", discount: "30% off", original: "$1,600", now: "$1,120", days: 4, gradient: "from-orange-800 via-amber-600 to-yellow-400" },
  { destination: "Reykjavik", discount: "20% off", original: "$2,000", now: "$1,600", days: 3, gradient: "from-cyan-800 via-teal-600 to-emerald-400" },
  { destination: "Cape Town", discount: "15% off", original: "$1,900", now: "$1,615", days: 6, gradient: "from-amber-800 via-orange-600 to-red-400" }
]

const QUICK_PROMPTS = [
  { text: "Budget trip to Bali for 5 days", icon: FiSun },
  { text: "Luxury Europe tour for 2 weeks", icon: FiStar },
  { text: "Solo Japan adventure for 7 days", icon: FiCompass },
  { text: "Family beach vacation under $3000", icon: FiHeart }
]

const TESTIMONIALS = [
  { name: "Sarah Mitchell", initials: "SM", location: "New York, USA", quote: "TravelEase planned our honeymoon to Santorini and it was absolutely perfect. Every restaurant, every sunset spot -- they nailed it.", rating: 5, color: "bg-rose-500" },
  { name: "James Chen", initials: "JC", location: "London, UK", quote: "I was skeptical about AI travel planning, but the Kyoto itinerary was better than anything I could have built on my own. The local tips were incredible.", rating: 5, color: "bg-blue-500" },
  { name: "Amara Osei", initials: "AO", location: "Toronto, Canada", quote: "Used TravelEase for a budget backpacking trip through Southeast Asia. Saved me hours of research and found hidden gems I never would have discovered.", rating: 5, color: "bg-emerald-500" }
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
    <Card className="overflow-hidden border-border/50 hover:shadow-lg transition-all duration-300 group">
      <div className="h-2 bg-gradient-to-r from-amber-700 via-amber-500 to-yellow-400" />
      <CardContent className="p-5">
        <div className="flex items-start justify-between mb-3">
          <div>
            <h4 className="font-serif font-semibold text-sm tracking-wide">{hotel?.name ?? 'Hotel'}</h4>
            <div className="mt-1">{renderStars(hotel?.rating ?? 0)}</div>
          </div>
          <Badge variant="secondary" className="text-xs capitalize font-serif">{hotel?.category ?? 'Standard'}</Badge>
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed mb-4">{hotel?.description ?? ''}</p>
        <div className="flex items-center justify-between pt-3 border-t border-border/30">
          <span className="font-serif font-bold text-primary text-base">{hotel?.price_per_night ?? 'N/A'}</span>
          <span className="text-xs text-muted-foreground italic">per night</span>
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
    <Card className="overflow-hidden border-border/50 hover:shadow-lg transition-all duration-300 group">
      <CardContent className="p-5">
        <div className="flex items-start gap-3">
          <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-accent/20 to-primary/10 flex items-center justify-center flex-shrink-0">
            <BiWalk className="h-5 w-5 text-accent" />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-serif font-semibold text-sm tracking-wide">{tour?.name ?? 'Tour'}</h4>
            <p className="text-xs text-muted-foreground leading-relaxed mt-1.5">{tour?.description ?? ''}</p>
            <div className="flex items-center gap-4 mt-3 pt-2 border-t border-border/30">
              <span className="flex items-center gap-1.5 text-xs text-muted-foreground"><FiClock className="h-3 w-3" />{tour?.duration ?? 'N/A'}</span>
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
          <div className="h-9 w-9 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-primary-foreground text-xs font-bold shadow-md">{day?.day ?? '?'}</div>
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
            <div className="flex items-start gap-2 p-3 rounded-xl bg-gradient-to-r from-accent/10 to-primary/5 border border-accent/20">
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
      <div className="h-1.5 bg-gradient-to-r from-accent via-amber-500 to-primary" />
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-serif flex items-center gap-2"><FiDollarSign className="h-4 w-4 text-accent" />Cost Estimate</CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-2.5">
          {rows.map((r, i) => (
            <div key={i} className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">{r.label}</span>
              <span className="font-medium font-serif">{r.value ?? 'N/A'}</span>
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
          <button onClick={() => setView('home')} className="flex items-center gap-2.5 group">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-md group-hover:shadow-lg transition-shadow">
              <FiCompass className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="font-serif text-xl font-bold tracking-wider text-foreground">TravelEase</span>
          </button>
          <div className="hidden md:flex items-center gap-8">
            <button onClick={() => setView('home')} className={cn("text-sm font-medium transition-colors tracking-wide", currentView === 'home' ? 'text-primary' : 'text-muted-foreground hover:text-foreground')}>Home</button>
            <button onClick={() => setView('trips')} className={cn("text-sm font-medium transition-colors flex items-center gap-1.5 tracking-wide", currentView === 'trips' ? 'text-primary' : 'text-muted-foreground hover:text-foreground')}>
              My Trips
              {savedCount > 0 && <span className="h-5 w-5 rounded-full bg-accent text-accent-foreground text-xs flex items-center justify-center font-bold">{savedCount}</span>}
            </button>
            <Button onClick={() => setView('chat')} size="sm" className="bg-gradient-to-r from-primary to-accent text-primary-foreground hover:opacity-90 font-serif tracking-wider shadow-lg hover:shadow-xl transition-all duration-300 px-6">
              <HiSparkles className="h-4 w-4 mr-1.5" />Plan My Trip
            </Button>
          </div>
          <button onClick={() => setMobileOpen(!mobileOpen)} className="md:hidden p-2 rounded-lg hover:bg-secondary transition-colors">
            {mobileOpen ? <FiX className="h-5 w-5" /> : <FiMenu className="h-5 w-5" />}
          </button>
        </div>
      </div>
      <div className="h-[2px] bg-gradient-to-r from-transparent via-accent/60 to-transparent" />
      {mobileOpen && (
        <div className="md:hidden border-t border-border/40 bg-background">
          <div className="px-4 py-3 space-y-2">
            <button onClick={() => { setView('home'); setMobileOpen(false) }} className="block w-full text-left px-3 py-2 rounded-lg text-sm hover:bg-secondary transition-colors">Home</button>
            <button onClick={() => { setView('trips'); setMobileOpen(false) }} className="w-full text-left px-3 py-2 rounded-lg text-sm hover:bg-secondary transition-colors flex items-center gap-2">
              My Trips
              {savedCount > 0 && <span className="h-5 w-5 rounded-full bg-accent text-accent-foreground text-xs flex items-center justify-center font-bold">{savedCount}</span>}
            </button>
            <Button onClick={() => { setView('chat'); setMobileOpen(false) }} className="w-full bg-gradient-to-r from-primary to-accent text-primary-foreground hover:opacity-90 font-serif tracking-wider">
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
      {/* HERO SECTION - Dramatic layered background */}
      <section className="relative overflow-hidden">
        {/* Multi-layer gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/15 via-accent/10 to-secondary/30" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-tr from-amber-900/5 via-transparent to-rose-900/5" />
        {/* Radial glow */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-accent/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 w-[400px] h-[300px] bg-primary/5 rounded-full blur-3xl" />
        {/* Dot pattern overlay */}
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(circle, currentColor 1px, transparent 1px)', backgroundSize: '24px 24px' }} />

        {/* Decorative floating travel icons */}
        <div className="absolute top-16 left-[10%] text-accent/15 animate-pulse">
          <FiMapPin className="h-10 w-10" />
        </div>
        <div className="absolute top-28 right-[12%] text-primary/10 animate-pulse" style={{ animationDelay: '1s' }}>
          <FiCompass className="h-12 w-12" />
        </div>
        <div className="absolute bottom-20 left-[15%] text-accent/10 animate-pulse" style={{ animationDelay: '0.5s' }}>
          <FiSun className="h-8 w-8" />
        </div>
        <div className="absolute top-20 right-[30%] text-primary/8 animate-pulse" style={{ animationDelay: '1.5s' }}>
          <FiGlobe className="h-7 w-7" />
        </div>
        <div className="absolute bottom-32 right-[20%] text-accent/10 animate-pulse" style={{ animationDelay: '2s' }}>
          <FiNavigation className="h-9 w-9" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-28 lg:py-36">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 border border-accent/20 mb-8 shadow-sm">
              <HiSparkles className="h-4 w-4 text-accent" />
              <span className="text-xs font-medium text-accent tracking-wide">AI-Powered Travel Planning</span>
            </div>
            <h1 className="font-serif text-4xl sm:text-5xl lg:text-7xl font-bold tracking-wider leading-tight mb-6">
              Discover Your
              <span className="block bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">Perfect Journey</span>
            </h1>
            <p className="text-muted-foreground text-base sm:text-lg leading-relaxed mb-10 max-w-2xl mx-auto tracking-wide">
              Let our AI travel advisor craft personalized itineraries, find the best hotels, and plan unforgettable experiences tailored to your style and budget.
            </p>
            <div className="flex flex-col sm:flex-row items-center gap-3 max-w-2xl mx-auto">
              <div className="relative w-full">
                <FiSearch className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  value={heroQuery}
                  onChange={(e) => setHeroQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleHeroSubmit()}
                  placeholder="Where do you want to go? Try 'Bali for 5 days'..."
                  className="pl-14 pr-6 h-14 text-base bg-card/80 backdrop-blur-sm border-border/30 shadow-xl rounded-2xl focus-visible:ring-accent ring-offset-2"
                  style={{ boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.06), 0 10px 30px rgba(0,0,0,0.08)' }}
                />
              </div>
              <Button onClick={handleHeroSubmit} size="lg" className="bg-gradient-to-r from-primary to-accent text-primary-foreground hover:opacity-90 font-serif tracking-wider h-14 px-10 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 whitespace-nowrap text-base">
                <FiArrowRight className="h-5 w-5 mr-2" />Plan My Trip
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* STATS / SOCIAL PROOF STRIP */}
      <section className="relative border-y border-border/30 bg-gradient-to-r from-card via-secondary/30 to-card">
        <div className="absolute inset-0 opacity-[0.02]" style={{ backgroundImage: 'radial-gradient(circle, currentColor 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
            {[
              { icon: FiGlobe, value: "50,000+", label: "Trips Planned" },
              { icon: FiMapPin, value: "120+", label: "Countries" },
              { icon: FiStar, value: "4.9", label: "Average Rating" },
              { icon: FiShield, value: "24/7", label: "AI Support" }
            ].map((stat, i) => {
              const StatIcon = stat.icon
              return (
                <div key={i} className="text-center group">
                  <div className="inline-flex items-center justify-center h-12 w-12 rounded-xl bg-gradient-to-br from-primary/10 to-accent/10 mb-3 group-hover:scale-110 transition-transform duration-300">
                    <StatIcon className="h-5 w-5 text-primary" />
                  </div>
                  <div className="font-serif text-2xl font-bold tracking-wide text-foreground">{stat.value}</div>
                  <div className="text-xs text-muted-foreground tracking-wider uppercase mt-0.5">{stat.label}</div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Filter Chips */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-10 mb-6">
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
                className={cn("flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium transition-all duration-300 border", isActive ? 'bg-gradient-to-r from-primary to-accent text-primary-foreground border-primary shadow-lg' : 'bg-card text-muted-foreground border-border/50 hover:border-accent/50 hover:text-foreground hover:shadow-md')}
              >
                <Icon className="h-4 w-4" />{chip.label}
              </button>
            )
          })}
        </div>
      </section>

      {/* FEATURED DESTINATIONS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="font-serif text-3xl font-bold tracking-wider">Featured Destinations</h2>
            <p className="text-muted-foreground text-sm mt-1.5 tracking-wide">Curated places for every type of traveler</p>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredDestinations.map((dest, i) => {
            const DestIcon = dest.icon
            return (
              <Card key={i} className="group overflow-hidden border-border/20 hover:shadow-2xl transition-all duration-500 cursor-pointer rounded-2xl" onClick={() => handleExplore(dest.name)}>
                <div className={cn("h-60 bg-gradient-to-br flex flex-col justify-between p-6 relative overflow-hidden", dest.gradient)}>
                  {/* Gradient overlay layers for depth */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-white/5" />
                  <div className="absolute inset-0 bg-black/5 group-hover:bg-black/0 transition-all duration-500" />
                  {/* Shine effect on hover */}
                  <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/0 to-white/0 group-hover:via-white/10 group-hover:to-white/5 transition-all duration-700" />
                  {/* Decorative icon */}
                  <div className="relative z-10 self-end">
                    <div className="h-10 w-10 rounded-xl bg-white/15 backdrop-blur-sm flex items-center justify-center border border-white/20 group-hover:scale-110 transition-transform duration-300">
                      <DestIcon className="h-5 w-5 text-white" />
                    </div>
                  </div>
                  <div className="relative z-10">
                    <Badge className="bg-white/20 text-white border-white/30 backdrop-blur-sm text-xs mb-2 font-serif tracking-wide">{dest.category}</Badge>
                    <h3 className="font-serif text-2xl font-bold text-white tracking-wider">{dest.name}</h3>
                    <p className="text-white/70 text-xs mt-1 italic tracking-wide">{dest.tagline}</p>
                  </div>
                </div>
                <CardFooter className="p-5 flex items-center justify-between bg-gradient-to-r from-card to-secondary/20">
                  <span className="text-sm text-muted-foreground flex items-center gap-1.5 font-serif"><FiMapPin className="h-3.5 w-3.5 text-accent" />{dest.name.split(', ')[1] ?? dest.name}</span>
                  <div className="flex items-center gap-3">
                    <span className="font-serif font-bold text-primary">{dest.price}</span>
                    <span className="text-sm font-medium text-accent flex items-center gap-1 group-hover:gap-2 transition-all">Explore <FiChevronRight className="h-4 w-4" /></span>
                  </div>
                </CardFooter>
              </Card>
            )
          })}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="relative overflow-hidden bg-gradient-to-b from-secondary/20 via-secondary/40 to-secondary/20 border-y border-border/20">
        <div className="absolute inset-0 opacity-[0.02]" style={{ backgroundImage: 'linear-gradient(45deg, currentColor 25%, transparent 25%, transparent 75%, currentColor 75%), linear-gradient(45deg, currentColor 25%, transparent 25%, transparent 75%, currentColor 75%)', backgroundSize: '20px 20px', backgroundPosition: '0 0, 10px 10px' }} />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center mb-14">
            <h2 className="font-serif text-3xl font-bold tracking-wider mb-3">How It Works</h2>
            <p className="text-muted-foreground text-sm tracking-wide max-w-xl mx-auto">Three simple steps to your dream vacation</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {[
              { step: 1, title: "Tell Us Your Dream", icon: FiMessageSquare, desc: "Share your destination, dates, budget, and travel style with our AI advisor." },
              { step: 2, title: "AI Crafts Your Plan", icon: HiSparkles, desc: "Our AI advisor builds a personalized day-by-day itinerary with hotels, tours, and tips." },
              { step: 3, title: "Explore & Refine", icon: FiCompass, desc: "Refine your plan, save it, and start your adventure with confidence." }
            ].map((s) => {
              const StepIcon = s.icon
              return (
                <div key={s.step} className="text-center group">
                  <div className="relative inline-flex mb-6">
                    <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-primary/10 to-accent/10 border-2 border-border/30 flex items-center justify-center group-hover:scale-110 group-hover:shadow-xl transition-all duration-300">
                      <StepIcon className="h-8 w-8 text-primary" />
                    </div>
                    <div className="absolute -top-2 -right-2 h-8 w-8 rounded-full bg-gradient-to-br from-accent to-primary flex items-center justify-center text-primary-foreground text-xs font-bold shadow-lg">
                      {s.step}
                    </div>
                  </div>
                  <h3 className="font-serif text-lg font-bold tracking-wider mb-2">{s.title}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed max-w-xs mx-auto tracking-wide">{s.desc}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* TRENDING DEALS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="flex items-center gap-3 mb-8">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-accent/20 to-primary/10 flex items-center justify-center">
            <FiTrendingUp className="h-5 w-5 text-accent" />
          </div>
          <div>
            <h2 className="font-serif text-3xl font-bold tracking-wider">Trending Deals</h2>
            <p className="text-muted-foreground text-xs tracking-wide mt-0.5">Limited-time offers on popular destinations</p>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {TRENDING_DEALS.map((deal, i) => (
            <Card key={i} className="overflow-hidden border-border/20 hover:shadow-2xl transition-all duration-500 cursor-pointer rounded-2xl group" onClick={() => handleExplore(deal.destination)}>
              <div className={cn("h-28 bg-gradient-to-br relative overflow-hidden", deal.gradient)}>
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                <div className="absolute inset-0 bg-black/5 group-hover:bg-black/0 transition-all" />
                <div className="absolute top-3 right-3 z-10">
                  <Badge className="bg-white text-foreground border-0 font-serif font-bold shadow-lg text-sm px-3 py-1">{deal.discount}</Badge>
                </div>
                <div className="absolute bottom-3 left-4 z-10">
                  <h3 className="font-serif text-xl font-bold text-white tracking-wider">{deal.destination}</h3>
                </div>
              </div>
              <CardContent className="p-5">
                <div className="flex items-center gap-3 mb-3">
                  <span className="line-through text-muted-foreground text-sm">{deal.original}</span>
                  <span className="font-serif font-bold text-primary text-xl">{deal.now}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground flex items-center gap-1.5"><FiCalendar className="h-3.5 w-3.5" />{deal.days} days</span>
                  <span className="text-xs font-medium text-accent flex items-center gap-1 group-hover:gap-2 transition-all">Book now <FiArrowRight className="h-3.5 w-3.5" /></span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="relative overflow-hidden bg-gradient-to-b from-card/50 via-secondary/30 to-card/50 border-y border-border/20">
        <div className="absolute inset-0 opacity-[0.015]" style={{ backgroundImage: 'radial-gradient(circle, currentColor 1px, transparent 1px)', backgroundSize: '16px 16px' }} />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center mb-14">
            <h2 className="font-serif text-3xl font-bold tracking-wider mb-3">Loved by Travelers</h2>
            <p className="text-muted-foreground text-sm tracking-wide max-w-xl mx-auto">See what our community has to say about their experiences</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {TESTIMONIALS.map((t, i) => (
              <Card key={i} className="border-border/20 rounded-2xl overflow-hidden hover:shadow-xl transition-all duration-300 group">
                <CardContent className="p-7">
                  <div className="flex items-center gap-0.5 mb-4">
                    {Array.from({ length: t.rating }).map((_, si) => (
                      <FiStar key={si} className="h-4 w-4 fill-amber-500 text-amber-500" />
                    ))}
                  </div>
                  <p className="text-sm text-foreground leading-relaxed italic mb-6 min-h-[80px]">&ldquo;{t.quote}&rdquo;</p>
                  <div className="flex items-center gap-3 pt-4 border-t border-border/30">
                    <div className={cn("h-10 w-10 rounded-full flex items-center justify-center text-white text-sm font-bold", t.color)}>
                      {t.initials}
                    </div>
                    <div>
                      <div className="font-serif font-semibold text-sm tracking-wide">{t.name}</div>
                      <div className="text-xs text-muted-foreground flex items-center gap-1"><FiMapPin className="h-3 w-3" />{t.location}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-gradient-to-b from-card to-secondary/30 border-t border-border/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">
            {/* Brand Column */}
            <div className="md:col-span-1">
              <div className="flex items-center gap-2.5 mb-4">
                <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-md">
                  <FiCompass className="h-5 w-5 text-primary-foreground" />
                </div>
                <span className="font-serif text-xl font-bold tracking-wider">TravelEase</span>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed tracking-wide mb-5">AI-powered travel planning that crafts your perfect journey, every time.</p>
              <div className="flex items-center gap-3">
                {[FiTwitter, FiInstagram, FiYoutube].map((SocialIcon, si) => (
                  <button key={si} className="h-9 w-9 rounded-xl bg-secondary/50 flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all duration-300">
                    <SocialIcon className="h-4 w-4" />
                  </button>
                ))}
              </div>
            </div>

            {/* Company */}
            <div>
              <h4 className="font-serif font-bold text-sm tracking-wider uppercase mb-4 text-foreground">Company</h4>
              <div className="space-y-2.5">
                {['About Us', 'Careers', 'Blog', 'Press'].map((item) => (
                  <button key={item} className="block text-sm text-muted-foreground hover:text-foreground transition-colors tracking-wide">{item}</button>
                ))}
              </div>
            </div>

            {/* Destinations */}
            <div>
              <h4 className="font-serif font-bold text-sm tracking-wider uppercase mb-4 text-foreground">Destinations</h4>
              <div className="space-y-2.5">
                {['Asia', 'Europe', 'Americas', 'Africa', 'Oceania'].map((item) => (
                  <button key={item} className="block text-sm text-muted-foreground hover:text-foreground transition-colors tracking-wide">{item}</button>
                ))}
              </div>
            </div>

            {/* Newsletter */}
            <div>
              <h4 className="font-serif font-bold text-sm tracking-wider uppercase mb-4 text-foreground">Stay Inspired</h4>
              <p className="text-sm text-muted-foreground mb-4 tracking-wide">Get travel tips and deals straight to your inbox.</p>
              <div className="flex gap-2">
                <Input placeholder="Your email" className="bg-background/50 border-border/30 rounded-xl text-sm h-10" />
                <Button size="sm" className="bg-gradient-to-r from-primary to-accent text-primary-foreground h-10 px-4 rounded-xl">
                  <FiMail className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          <Separator className="mb-6 bg-border/30" />

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs text-muted-foreground tracking-wide">TravelEase AI Travel Platform. All rights reserved.</p>
            <div className="flex items-center gap-6">
              <button className="text-xs text-muted-foreground hover:text-foreground transition-colors tracking-wide">Privacy</button>
              <button className="text-xs text-muted-foreground hover:text-foreground transition-colors tracking-wide">Terms</button>
              <button className="text-xs text-muted-foreground hover:text-foreground transition-colors tracking-wide">Support</button>
            </div>
          </div>
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
    <div className="flex flex-col lg:flex-row h-[calc(100vh-4.5rem)]">
      {/* Chat Panel */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Chat Header with warm gradient */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-border/40 bg-gradient-to-r from-primary/5 via-accent/5 to-card/80 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-md">
              <FiCompass className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h3 className="font-serif font-semibold text-sm tracking-wider">Travel Advisor</h3>
              <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                {isLoading ? (
                  <><span className="h-2 w-2 rounded-full bg-accent animate-pulse inline-block" /> Crafting your itinerary...</>
                ) : (
                  <><span className="h-2 w-2 rounded-full bg-green-500 inline-block" /> Ready to explore</>
                )}
              </span>
            </div>
          </div>
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="lg:hidden p-2 rounded-xl hover:bg-secondary transition-colors">
            <FiMap className="h-5 w-5" />
          </button>
        </div>

        {/* Messages */}
        <ScrollArea className="flex-1">
          <div className="p-4 space-y-4 max-w-3xl mx-auto w-full">
            {messages.map((msg) => (
              <div key={msg.id} className={cn("flex", msg.role === 'user' ? 'justify-end' : 'justify-start')}>
                <div className={cn("max-w-[85%] rounded-2xl px-5 py-3.5", msg.role === 'user' ? 'bg-gradient-to-br from-primary to-primary/90 text-primary-foreground rounded-br-md shadow-md' : 'bg-card border border-border/50 rounded-bl-md shadow-sm')}>
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
                <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-destructive/10 border border-destructive/20 text-sm">
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

        {/* Quick Prompts with travel tags */}
        {messages.length <= 1 && !isLoading && (
          <div className="px-4 pb-3">
            <p className="text-xs text-muted-foreground text-center mb-2 tracking-wide font-serif">Try one of these to get started:</p>
            <div className="flex flex-wrap gap-2 max-w-3xl mx-auto justify-center">
              {QUICK_PROMPTS.map((prompt, i) => {
                const PromptIcon = prompt.icon
                return (
                  <button key={i} onClick={() => handleSend(prompt.text)} className="flex items-center gap-2 text-xs px-4 py-2 rounded-full bg-gradient-to-r from-card to-secondary/50 border border-border/50 text-muted-foreground hover:text-foreground hover:border-accent/50 hover:shadow-md transition-all duration-300 font-serif tracking-wide">
                    <PromptIcon className="h-3.5 w-3.5 text-accent" />
                    {prompt.text}
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* Input */}
        <div className="p-4 border-t border-border/40 bg-gradient-to-r from-card/30 via-secondary/10 to-card/30">
          <div className="flex items-center gap-3 max-w-3xl mx-auto">
            <Input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) handleSend() }}
              placeholder="Tell me about your dream trip..."
              disabled={isLoading}
              className="flex-1 h-12 bg-background/80 border-border/40 rounded-2xl focus-visible:ring-accent text-sm pl-5"
            />
            <Button onClick={() => handleSend()} disabled={isLoading || !inputValue.trim()} size="icon" className="h-12 w-12 rounded-2xl bg-gradient-to-r from-primary to-accent text-primary-foreground hover:opacity-90 shadow-md">
              <FiSend className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Itinerary Sidebar */}
      <div className={cn("border-l border-border/40 flex-shrink-0 overflow-hidden", sidebarOpen ? 'fixed inset-0 z-40 lg:relative lg:w-[380px]' : 'hidden lg:block lg:w-[380px]')}>
        {sidebarOpen && <div className="fixed inset-0 bg-black/30 lg:hidden" onClick={() => setSidebarOpen(false)} />}
        <div className={cn("h-full flex flex-col bg-gradient-to-b from-card/90 via-secondary/20 to-card/80", sidebarOpen ? 'relative z-50 w-[85vw] max-w-[380px] ml-auto h-screen' : '')}>
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-border/40 bg-gradient-to-r from-accent/5 to-primary/5">
            <h3 className="font-serif font-semibold text-sm tracking-wider flex items-center gap-2"><FiBookmark className="h-4 w-4 text-accent" />Trip Summary</h3>
            <button onClick={() => setSidebarOpen(false)} className="lg:hidden p-1 rounded-lg hover:bg-secondary"><FiX className="h-4 w-4" /></button>
          </div>
          <ScrollArea className="flex-1">
            <div className="p-5 space-y-5">
              {latestData ? (
                <>
                  {latestData.destination && (
                    <div className="flex items-center gap-3 p-4 rounded-2xl bg-gradient-to-r from-primary/10 via-accent/5 to-primary/5 border border-primary/10">
                      <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-md flex-shrink-0">
                        <FiMapPin className="h-5 w-5 text-primary-foreground" />
                      </div>
                      <div>
                        <span className="text-xs text-muted-foreground tracking-wide">Destination</span>
                        <h4 className="font-serif font-bold tracking-wider text-lg">{latestData.destination}</h4>
                      </div>
                    </div>
                  )}
                  {Array.isArray(latestData.itinerary) && latestData.itinerary.length > 0 && (
                    <div>
                      <h4 className="font-serif font-semibold text-xs tracking-wider text-muted-foreground mb-3 uppercase">Day Overview</h4>
                      <div className="space-y-2">
                        {latestData.itinerary.map((d, i) => (
                          <div key={i} className="flex items-center gap-3 text-sm p-2.5 rounded-xl hover:bg-secondary/30 transition-colors">
                            <span className="h-7 w-7 rounded-full bg-gradient-to-br from-primary/20 to-accent/10 text-primary text-xs font-bold flex items-center justify-center flex-shrink-0">{d?.day ?? i + 1}</span>
                            <span className="truncate font-serif tracking-wide">{d?.title ?? `Day ${d?.day ?? i + 1}`}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {Array.isArray(latestData.hotels) && latestData.hotels.length > 0 && (
                    <div>
                      <h4 className="font-serif font-semibold text-xs tracking-wider text-muted-foreground mb-3 uppercase">Recommended Hotels</h4>
                      <div className="space-y-2">
                        {latestData.hotels.map((h, i) => (
                          <div key={i} className="flex items-center justify-between text-sm p-3 rounded-xl bg-background/50 border border-border/20">
                            <div className="flex items-center gap-2 min-w-0">
                              <BiHotel className="h-4 w-4 text-accent flex-shrink-0" />
                              <span className="truncate font-serif tracking-wide">{h?.name ?? 'Hotel'}</span>
                            </div>
                            <span className="text-xs text-primary font-serif font-bold flex-shrink-0 ml-2">{h?.price_per_night ?? ''}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {latestData.cost_summary && (
                    <div className="p-4 rounded-2xl bg-gradient-to-r from-accent/10 to-primary/5 border border-accent/20">
                      <span className="text-xs text-muted-foreground tracking-wide">Estimated Total</span>
                      <div className="font-serif font-bold text-xl text-primary tracking-wide">{latestData.cost_summary?.total ?? 'N/A'}</div>
                    </div>
                  )}
                  <Button onClick={() => onSaveItinerary(latestData)} className="w-full bg-gradient-to-r from-primary to-accent text-primary-foreground hover:opacity-90 font-serif tracking-wider rounded-2xl h-12 shadow-md">
                    <FiBookmark className="h-4 w-4 mr-2" />Save This Itinerary
                  </Button>
                </>
              ) : (
                <div className="text-center py-16">
                  {/* Decorative compass rose */}
                  <div className="relative inline-flex mb-6">
                    <div className="h-24 w-24 rounded-full bg-gradient-to-br from-primary/5 to-accent/5 border-2 border-dashed border-border/30 flex items-center justify-center">
                      <FiCompass className="h-10 w-10 text-muted-foreground/20" />
                    </div>
                    <div className="absolute -top-1 left-1/2 -translate-x-1/2 h-3 w-3 rounded-full bg-accent/20" />
                    <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 h-3 w-3 rounded-full bg-primary/20" />
                    <div className="absolute top-1/2 -translate-y-1/2 -left-1 h-3 w-3 rounded-full bg-accent/20" />
                    <div className="absolute top-1/2 -translate-y-1/2 -right-1 h-3 w-3 rounded-full bg-primary/20" />
                  </div>
                  <h4 className="font-serif font-semibold text-sm tracking-wider mb-2">No Itinerary Yet</h4>
                  <p className="text-xs text-muted-foreground leading-relaxed tracking-wide max-w-[200px] mx-auto">Start a conversation to build your personalized travel plan.</p>
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
    'from-pink-900 via-rose-700 to-amber-500',
    'from-blue-900 via-blue-500 to-sky-300',
    'from-emerald-900 via-green-600 to-teal-400',
    'from-violet-900 via-purple-600 to-indigo-400',
    'from-orange-900 via-red-700 to-amber-500',
    'from-slate-800 via-blue-600 to-sky-200'
  ]

  const uniqueDestinations = new Set(displayTrips.map(t => t.destination?.split(',')[0] ?? '').filter(Boolean))

  return (
    <div>
      {/* Decorative header */}
      <div className="relative overflow-hidden bg-gradient-to-br from-primary/10 via-accent/5 to-secondary/20 border-b border-border/20">
        <div className="absolute inset-0 opacity-[0.02]" style={{ backgroundImage: 'radial-gradient(circle, currentColor 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
        <div className="absolute top-6 right-[10%] text-accent/10">
          <FiGlobe className="h-16 w-16" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <h1 className="font-serif text-3xl font-bold tracking-wider mb-2">My Trips</h1>
          <p className="text-muted-foreground text-sm tracking-wide">Your saved itineraries and travel plans</p>
          {/* Fun stats */}
          <div className="flex items-center gap-6 mt-5">
            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-card/80 border border-border/20 shadow-sm">
              <FiBookmark className="h-4 w-4 text-accent" />
              <span className="font-serif font-bold text-sm">{displayTrips.length}</span>
              <span className="text-xs text-muted-foreground">trips saved</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-card/80 border border-border/20 shadow-sm">
              <FiGlobe className="h-4 w-4 text-primary" />
              <span className="font-serif font-bold text-sm">{uniqueDestinations.size}</span>
              <span className="text-xs text-muted-foreground">destinations</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search & Filter */}
        <div className="flex flex-col sm:flex-row items-center gap-3 mb-8">
          <div className="relative w-full sm:max-w-sm">
            <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search destinations..." className="pl-11 bg-card border-border/30 rounded-xl h-11" />
          </div>
          <div className="flex items-center gap-2">
            {['Solo', 'Budget', 'Luxury'].map(type => (
              <button key={type} onClick={() => setFilterType(filterType === type ? null : type)} className={cn("px-4 py-2 rounded-full text-xs font-medium border transition-all duration-300 font-serif tracking-wide", filterType === type ? 'bg-gradient-to-r from-primary to-accent text-primary-foreground border-primary shadow-md' : 'bg-card text-muted-foreground border-border/50 hover:border-accent/50')}>
                {type}
              </button>
            ))}
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="text-center py-24">
            {/* Beautiful empty state with layered shapes */}
            <div className="relative inline-flex mb-8">
              <div className="h-32 w-32 rounded-3xl bg-gradient-to-br from-primary/10 to-accent/5 border-2 border-dashed border-border/30 flex items-center justify-center rotate-3">
                <div className="h-24 w-24 rounded-2xl bg-gradient-to-br from-accent/10 to-primary/5 border border-border/20 flex items-center justify-center -rotate-6">
                  <FiCompass className="h-12 w-12 text-muted-foreground/20" />
                </div>
              </div>
              <div className="absolute -top-2 -right-2">
                <FiMapPin className="h-6 w-6 text-accent/30" />
              </div>
              <div className="absolute -bottom-3 -left-3">
                <FiSun className="h-5 w-5 text-primary/20" />
              </div>
            </div>
            <h3 className="font-serif text-2xl font-bold tracking-wider mb-3">No Saved Trips Yet</h3>
            <p className="text-muted-foreground text-sm mb-8 max-w-md mx-auto tracking-wide leading-relaxed">Start planning your next adventure and save your itineraries here for easy access.</p>
            <Button onClick={() => onResume('')} size="lg" className="bg-gradient-to-r from-primary to-accent text-primary-foreground hover:opacity-90 font-serif tracking-wider rounded-2xl h-12 px-8 shadow-lg">
              <HiSparkles className="h-5 w-5 mr-2" />Start Planning
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filtered.map((trip, i) => (
              <Card key={trip.id} className="overflow-hidden border-border/20 hover:shadow-2xl transition-all duration-500 group rounded-2xl">
                <div className={cn("h-44 bg-gradient-to-br flex flex-col justify-between p-5 relative overflow-hidden", gradients[i % gradients.length])}>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-white/5" />
                  <div className="absolute inset-0 bg-black/5 group-hover:bg-black/0 transition-all duration-500" />
                  <div className="relative z-10 self-end">
                    <Badge className="bg-white/20 text-white border-white/30 backdrop-blur-sm text-xs font-serif tracking-wide">{trip.travelerType ?? 'Trip'}</Badge>
                  </div>
                  <div className="relative z-10">
                    <h3 className="font-serif text-xl font-bold text-white tracking-wider">{trip.destination ?? 'Untitled Trip'}</h3>
                  </div>
                </div>
                <CardContent className="p-5 space-y-3">
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1.5"><FiCalendar className="h-3.5 w-3.5 text-accent" />{trip.dateRange ?? 'No date'}</span>
                    <span className="flex items-center gap-1.5"><FiDollarSign className="h-3.5 w-3.5 text-primary" />{trip.budget ?? 'N/A'}</span>
                  </div>
                  <div className="text-xs text-muted-foreground tracking-wide">
                    Saved {trip.savedAt ? new Date(trip.savedAt).toLocaleDateString() : 'recently'}
                  </div>
                </CardContent>
                <CardFooter className="p-5 pt-0 flex items-center gap-2">
                  <Button size="sm" variant="outline" onClick={() => setDetailTrip(trip)} className="flex-1 text-xs rounded-xl font-serif tracking-wide">
                    <FiSearch className="h-3 w-3 mr-1" />Details
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => onResume(trip.destination)} className="flex-1 text-xs rounded-xl font-serif tracking-wide">
                    <FiMessageSquare className="h-3 w-3 mr-1" />Resume
                  </Button>
                  {deleteConfirm === trip.id ? (
                    <div className="flex items-center gap-1">
                      <Button size="sm" variant="destructive" onClick={() => { onDelete(trip.id); setDeleteConfirm(null) }} className="text-xs px-2 rounded-xl">
                        <FiCheck className="h-3 w-3" />
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => setDeleteConfirm(null)} className="text-xs px-2 rounded-xl">
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
          <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto bg-background rounded-2xl">
            <DialogHeader>
              <DialogTitle className="font-serif text-xl tracking-wider flex items-center gap-2">
                <FiMapPin className="h-5 w-5 text-primary" />{detailTrip?.destination ?? 'Trip Details'}
              </DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground tracking-wide">
                {detailTrip?.travelerType ?? ''} trip{detailTrip?.budget ? ` - ${detailTrip.budget}` : ''}
              </DialogDescription>
            </DialogHeader>
            {detailTrip?.data && (
              <div className="mt-4">
                <Tabs defaultValue="itinerary">
                  <TabsList className="w-full">
                    <TabsTrigger value="itinerary" className="flex-1 font-serif tracking-wide">Itinerary</TabsTrigger>
                    <TabsTrigger value="hotels" className="flex-1 font-serif tracking-wide">Hotels</TabsTrigger>
                    <TabsTrigger value="tours" className="flex-1 font-serif tracking-wide">Tours</TabsTrigger>
                    <TabsTrigger value="cost" className="flex-1 font-serif tracking-wide">Cost</TabsTrigger>
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
    </div>
  )
}

// ============================================================
// AGENT STATUS PANEL
// ============================================================
function AgentStatusPanel({ activeAgentId }: { activeAgentId: string | null }) {
  return (
    <div className="fixed bottom-4 left-4 z-40">
      <Card className="border-border/30 shadow-lg bg-card/90 backdrop-blur-sm rounded-2xl overflow-hidden">
        <div className="h-0.5 bg-gradient-to-r from-primary via-accent to-primary" />
        <CardContent className="p-3.5 flex items-center gap-3">
          <div className={cn("h-2.5 w-2.5 rounded-full flex-shrink-0", activeAgentId ? 'bg-accent animate-pulse' : 'bg-green-500')} />
          <div className="text-xs">
            <span className="font-serif font-medium text-foreground tracking-wide">Travel Advisor AI</span>
            <span className="text-muted-foreground ml-2">{activeAgentId ? 'Planning...' : 'Ready'}</span>
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
          <Card className="border-border/30 shadow-lg bg-card/90 backdrop-blur-sm rounded-2xl overflow-hidden">
            <div className="h-0.5 bg-gradient-to-r from-accent to-primary" />
            <CardContent className="p-3 flex items-center gap-3">
              <label htmlFor="sample-toggle" className="text-xs font-serif font-medium text-muted-foreground whitespace-nowrap cursor-pointer tracking-wide">Sample Data</label>
              <Switch id="sample-toggle" checked={showSample} onCheckedChange={setShowSample} />
            </CardContent>
          </Card>
        </div>

        {/* Save Status Inline */}
        {saveStatus && (
          <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50">
            <div className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-accent/10 border border-accent/20 shadow-lg backdrop-blur-sm">
              <FiCheck className="h-4 w-4 text-accent" />
              <span className="text-sm font-serif font-medium text-accent tracking-wide">{saveStatus}</span>
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