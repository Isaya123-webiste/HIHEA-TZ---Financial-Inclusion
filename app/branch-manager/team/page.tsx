"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  AlertCircle,
  Building2,
  LogOut,
  Menu,
  Users,
  RefreshCw,
  Search,
  Mail,
  Calendar,
  UserCheck,
  MoreVertical,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import Link from "next/link"
import { supabase } from "@/lib/supabase-client"
import { getUserProfile } from "@/lib/auth"
import { getBranchMetrics } from "@/lib/branch-metrics-actions"

type TeamMember = {
  id: string
  full_name: string
  email: string
  role: string
  status: string
  created_at: string
}

type Branch = {
  id: string
  name: string
  status: string
}

export default function TeamPage() {
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [branch, setBranch] = useState<Branch | null>(null)
  const [allTeamMembers, setAllTeamMembers] = useState<TeamMember[]>([])
  const [filteredMembers, setFilteredMembers] = useState<TeamMember[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [roleFilter, setRoleFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const [viewMode, setViewMode] = useState<"cards" | "table">("cards")
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const router = useRouter()

  useEffect(() => {
    loadUserData()
  }, [router])

  useEffect(() => {
    filterMembers()
  }, [allTeamMembers, searchQuery, roleFilter, statusFilter])

  const loadUserData = async () => {
    try {
      setLoading(true)
      setError(null)

      const {
        data: { user: authUser },
        error: userError,
      } = await supabase.auth.getUser()

      if (userError || !authUser) {
        console.error("Auth error:", userError)
        router.push("/")
        return
      }

      setUser(authUser)

      const profileResult = await getUserProfile(authUser.id)
      if (profileResult.error || !profileResult.profile) {
        console.error("Profile error:", profileResult.error)
        setError("Failed to load profile")
        return
      }

      const userProfile = profileResult.profile

      if (userProfile.role !== "branch_manager") {
        switch (userProfile.role) {
          case "admin":
            router.push("/admin")
            break
          case "program_officer":
            router.push("/program-officer")
            break
          case "branch_report_officer":
          case "report_officer":
            router.push("/report-officer")
            break
          default:
            router.push("/dashboard")
        }
        return
      }

      if (userProfile.status !== "active") {
        setError("Your account is not active. Please contact administrator.")
        return
      }

      setProfile(userProfile)

      if (!userProfile.branch_id) {
        setError("Your account is not assigned to a branch. Please contact administrator.")
        return
      }

      await loadTeamMembersData(userProfile.branch_id, authUser.id)
    } catch (error) {
      console.error("Load user data error:", error)
      setError("Failed to load user data")
    } finally {
      setLoading(false)
    }
  }

  const loadTeamMembersData = async (branchId: string, currentUserId: string) => {
    try {
      const result = await getBranchMetrics(branchId, currentUserId)

      if (result.error) {
        setError(result.error)
        return
      }

      if (result.branch) {
        setBranch(result.branch)
      }

      if (result.teamMembers) {
        setAllTeamMembers(result.teamMembers)
        setLastUpdated(new Date())
      }
    } catch (error) {
      console.error("Load team members error:", error)
      setError("Failed to load team members")
    }
  }

  const filterMembers = () => {
    let filtered = allTeamMembers

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(
        (member) =>
          member.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          member.email.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    }

    // Role filter
    if (roleFilter !== "all") {
      filtered = filtered.filter((member) => member.role === roleFilter)
    }

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((member) => member.status === statusFilter)
    }

    setFilteredMembers(filtered)
  }

  const handleRefresh = () => {
    loadUserData()
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push("/")
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    }).format(date)
  }

  const formatLastUpdated = () => {
    if (!lastUpdated) return ""
    return `Last updated: ${lastUpdated.toLocaleTimeString()}`
  }

  const getRoleDisplayName = (role: string) => {
    switch (role) {
      case "program_officer":
        return "Program Officer"
      case "branch_report_officer":
      case "report_officer":
        return "Report Officer"
      case "branch_manager":
        return "Branch Manager"
      default:
        return role.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())
    }
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case "program_officer":
        return "bg-blue-100 text-blue-800"
      case "branch_report_officer":
      case "report_officer":
        return "bg-green-100 text-green-800"
      case "branch_manager":
        return "bg-purple-100 text-purple-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-500 hover:bg-green-600">Active</Badge>
      case "inactive":
        return <Badge className="bg-gray-500 hover:bg-gray-600">Inactive</Badge>
      case "pending":
        return <Badge className="bg-yellow-500 hover:bg-yellow-600">Pending</Badge>
      default:
        return <Badge className="bg-gray-500 hover:bg-gray-600">{status}</Badge>
    }
  }

  const getTeamStats = () => {
    const stats = {
      total: allTeamMembers.length,
      active: allTeamMembers.filter((m) => m.status === "active").length,
      program_officers: allTeamMembers.filter((m) => m.role === "program_officer").length,
      report_officers: allTeamMembers.filter((m) => m.role === "branch_report_officer" || m.role === "report_officer")
        .length,
      branch_managers: allTeamMembers.filter((m) => m.role === "branch_manager").length,
    }
    return stats
  }

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-red-600 border-t-transparent mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading team members...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardContent className="text-center space-y-4 p-6">
            <AlertCircle className="h-12 w-12 text-red-600 mx-auto" />
            <h2 className="text-xl font-semibold text-red-600">Access Error</h2>
            <p className="text-gray-600">{error}</p>
            <div className="space-y-2">
              <Button onClick={handleRefresh} className="w-full bg-red-600 hover:bg-red-700">
                <RefreshCw className="h-4 w-4 mr-2" />
                Retry
              </Button>
              <Button onClick={() => router.push("/")} variant="outline" className="w-full">
                Go to Login
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const stats = getTeamStats()

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <div
        className={`
          fixed inset-y-0 left-0 z-50 transition-all duration-300 bg-white border-r border-gray-200 shadow-lg lg:relative lg:translate-x-0
          ${isCollapsed ? "w-16" : "w-64"}
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
        `}
      >
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between h-16 px-4">
            {!isCollapsed && (
              <div className="flex items-center gap-2">
                <div className="bg-red-600 p-2 rounded-lg">
                  <Building2 className="h-6 w-6 text-white" />
                </div>
                <span className="text-gray-900 font-semibold">Branch Manager</span>
              </div>
            )}
            {isCollapsed && (
              <div className="flex w-full justify-center">
                <div className="bg-red-600 p-2 rounded-lg">
                  <Building2 className="h-6 w-6 text-white" />
                </div>
              </div>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="text-gray-600 hover:bg-gray-100 hidden lg:flex"
            >
              <Menu className="h-4 w-4" />
            </Button>
          </div>

          <nav className="flex-1 p-2 space-y-1">
            <Link
              href="/branch-manager"
              className={`
                flex items-center gap-3 w-full p-3 rounded-lg text-gray-700 hover:bg-gray-100 hover:text-gray-900 transition-colors
                ${isCollapsed ? "justify-center" : ""}
              `}
              title={isCollapsed ? "Dashboard" : undefined}
            >
              <Building2 className="h-5 w-5" />
              {!isCollapsed && <span>Dashboard</span>}
            </Link>
            <Link
              href="/branch-manager/team"
              className={`
                flex items-center gap-3 w-full p-3 rounded-lg bg-red-50 text-red-700 font-medium transition-colors border border-red-200
                ${isCollapsed ? "justify-center" : ""}
              `}
              title={isCollapsed ? "Team" : undefined}
            >
              <Users className="h-5 w-5" />
              {!isCollapsed && <span>Team</span>}
            </Link>
          </nav>

          <div className="p-2">
            <button
              onClick={handleSignOut}
              className={`
                flex items-center gap-3 w-full p-3 rounded-lg text-gray-700 hover:bg-gray-100 hover:text-gray-900 transition-colors
                ${isCollapsed ? "justify-center" : ""}
              `}
              title={isCollapsed ? "Sign Out" : undefined}
            >
              <LogOut className="h-5 w-5" />
              {!isCollapsed && <span>Sign Out</span>}
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile Header */}
        <div className="flex h-16 items-center justify-between border-b bg-white px-4 lg:hidden">
          <Button variant="ghost" size="sm" onClick={() => setSidebarOpen(true)}>
            <Menu className="h-5 w-5" />
          </Button>
          <h1 className="font-semibold text-gray-900">Team Members</h1>
          <div className="w-8" />
        </div>

        {/* Page Header */}
        <div className="bg-white px-6 py-6 border-b border-gray-200">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Team Members</h1>
              <p className="text-gray-600 mt-1">
                {branch ? `Managing team at ${branch.name} branch` : "View your branch team"}
              </p>
              <p className="text-gray-500 text-sm mt-1">{formatLastUpdated()}</p>
            </div>
            <div className="flex items-center gap-3">
              <Button onClick={handleRefresh} variant="outline" size="sm">
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="bg-white px-6 py-6 border-b border-gray-100">
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            <Card className="bg-gradient-to-r from-red-500 to-red-600 text-white">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-red-100 text-sm font-medium">Total Members</p>
                    <p className="text-2xl font-bold">{stats.total}</p>
                  </div>
                  <Users className="h-8 w-8 text-red-200" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm font-medium">Active</p>
                    <p className="text-2xl font-bold text-green-600">{stats.active}</p>
                  </div>
                  <UserCheck className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm font-medium">Program Officers</p>
                    <p className="text-2xl font-bold text-blue-600">{stats.program_officers}</p>
                  </div>
                  <Users className="h-8 w-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm font-medium">Report Officers</p>
                    <p className="text-2xl font-bold text-green-600">{stats.report_officers}</p>
                  </div>
                  <Users className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm font-medium">Managers</p>
                    <p className="text-2xl font-bold text-purple-600">{stats.branch_managers}</p>
                  </div>
                  <Users className="h-8 w-8 text-purple-600" />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white px-6 py-4 border-b border-gray-100">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search team members by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-3">
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filter by role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="program_officer">Program Officers</SelectItem>
                  <SelectItem value="branch_report_officer">Report Officers</SelectItem>
                  <SelectItem value="report_officer">Report Officers (Legacy)</SelectItem>
                  <SelectItem value="branch_manager">Branch Managers</SelectItem>
                </SelectContent>
              </Select>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                </SelectContent>
              </Select>

              <div className="flex border rounded-lg">
                <Button
                  variant={viewMode === "cards" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("cards")}
                  className="rounded-r-none"
                >
                  Cards
                </Button>
                <Button
                  variant={viewMode === "table" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("table")}
                  className="rounded-l-none"
                >
                  Table
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Team Content */}
        <div className="flex-1 overflow-auto bg-gray-50 px-6 py-6">
          {filteredMembers.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No team members found</h3>
              <p className="text-gray-500">
                {searchQuery || roleFilter !== "all" || statusFilter !== "all"
                  ? "Try adjusting your search or filters"
                  : "No team members in your branch yet"}
              </p>
            </div>
          ) : viewMode === "cards" ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredMembers.map((member) => (
                <Card key={member.id} className="hover:shadow-lg transition-shadow duration-200">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-gradient-to-r from-red-500 to-red-600 rounded-full flex items-center justify-center text-white font-semibold text-lg">
                          {member.full_name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">{member.full_name}</h3>
                          <Badge className={`text-xs ${getRoleColor(member.role)}`}>
                            {getRoleDisplayName(member.role)}
                          </Badge>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Mail className="h-4 w-4" />
                        <span className="truncate">{member.email}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Calendar className="h-4 w-4" />
                        <span>Joined {formatDate(member.created_at)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Status:</span>
                        {getStatusBadge(member.status)}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="text-left py-4 px-6 font-semibold text-gray-900">Member</th>
                        <th className="text-left py-4 px-6 font-semibold text-gray-900">Role</th>
                        <th className="text-left py-4 px-6 font-semibold text-gray-900">Email</th>
                        <th className="text-left py-4 px-6 font-semibold text-gray-900">Joined</th>
                        <th className="text-left py-4 px-6 font-semibold text-gray-900">Status</th>
                        <th className="text-left py-4 px-6 font-semibold text-gray-900">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredMembers.map((member, index) => (
                        <tr
                          key={member.id}
                          className={`border-b border-gray-100 hover:bg-gray-50 ${index % 2 === 0 ? "bg-white" : "bg-gray-50/50"}`}
                        >
                          <td className="py-4 px-6">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-gradient-to-r from-red-500 to-red-600 rounded-full flex items-center justify-center text-white font-semibold">
                                {member.full_name.charAt(0).toUpperCase()}
                              </div>
                              <span className="font-medium text-gray-900">{member.full_name}</span>
                            </div>
                          </td>
                          <td className="py-4 px-6">
                            <Badge className={`${getRoleColor(member.role)}`}>{getRoleDisplayName(member.role)}</Badge>
                          </td>
                          <td className="py-4 px-6 text-gray-600">{member.email}</td>
                          <td className="py-4 px-6 text-gray-600">{formatDate(member.created_at)}</td>
                          <td className="py-4 px-6">{getStatusBadge(member.status)}</td>
                          <td className="py-4 px-6">
                            <Button variant="ghost" size="sm">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
