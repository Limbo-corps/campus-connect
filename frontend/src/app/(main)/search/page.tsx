"use client";

import { useState, useMemo } from "react";
import {
  Card,
  Skeleton,
  ScrollShadow,
  Avatar,
  Chip,
  Breadcrumbs,
} from "@heroui/react";
import {
  Search,
  Sparkles,
  MapPin,
  UserPlus,
  SlidersHorizontal,
  GraduationCap,
  Compass,
  HelpCircle,
} from "lucide-react";
import { useCampuses } from "@/hooks/useCampuses";
import { useAuth } from "@/contexts/AuthContext";
import CampusEmblem from "@/components/campus/CampusEmblem";
import InlineSearch from "@/components/layout/InlineSearch";
import Link from "next/link";

interface StudentUser {
  id: string;
  username: string;
  first_name: string;
  last_name: string;
  avatar_url?: string;
  campus?: string;
  bio?: string;
  headline?: string;
  major?: string;
}

const DUMMY_STUDENTS: StudentUser[] = [
  {
    id: "stud-1",
    username: "alex_dev",
    first_name: "Alex",
    last_name: "Rivera",
    headline: "Building open-source apps & drinking excessive espresso ☕",
    major: "Computer Science",
    campus: "camp-1",
  },
  {
    id: "stud-2",
    username: "sarah_design",
    first_name: "Sarah",
    last_name: "Chen",
    headline: "UI/UX enthusiast. Let's collaborate on hackathons!",
    major: "Digital Media Arts",
    campus: "camp-2",
  },
  {
    id: "stud-3",
    username: "marcus_j",
    first_name: "Marcus",
    last_name: "Johnson",
    headline: "Pre-med track | Fitness club lead | Researching genetics 🧬",
    major: "Bio-Molecular Engineering",
    campus: "camp-1",
  },
  {
    id: "stud-4",
    username: "elena_w",
    first_name: "Elena",
    last_name: "Rostova",
    headline: "Asst. Editor for Campus Chronicle. Send story scoops my way!",
    major: "Journalism & Media",
    campus: "camp-3",
  },
];

export default function SearchPage() {
  const { user: currentUser } = useAuth();
  const { campuses } = useCampuses();
  const [query, setQuery] = useState("");
  const [selectedCampusFilter, setSelectedCampusFilter] =
    useState<string>("all");

  const [students] = useState<StudentUser[]>(DUMMY_STUDENTS);
  const [loading] = useState(false);

  const userCampus = campuses.find(
    (c) => c.id === (currentUser as unknown as { campus?: string })?.campus,
  );

  const filteredStudents = useMemo(() => {
    return students.filter((student) => {
      const matchesQuery = !query
        ? true
        : student.username.toLowerCase().includes(query.toLowerCase()) ||
          `${student.first_name} ${student.last_name}`
            .toLowerCase()
            .includes(query.toLowerCase()) ||
          student.major?.toLowerCase().includes(query.toLowerCase()) ||
          student.headline?.toLowerCase().includes(query.toLowerCase());

      const matchesCampus =
        selectedCampusFilter === "all"
          ? true
          : selectedCampusFilter === "mine"
            ? student.campus === userCampus?.id
            : student.campus === selectedCampusFilter;

      return matchesQuery && matchesCampus;
    });
  }, [query, selectedCampusFilter, students, userCampus]);

  return (
    <div className="space-y-5 max-w-7xl mx-auto p-1">
      <Breadcrumbs>
        <Breadcrumbs.Item href="/feed">Home</Breadcrumbs.Item>
        <Breadcrumbs.Item>Directory</Breadcrumbs.Item>
      </Breadcrumbs>

      {/* Main Responsive Grid Layout */}
      <div className="grid grid-cols-12 gap-6">
        {/* ── Left Sticky Side Panel (Filters) ── */}
        <aside className="col-span-12 lg:col-span-4 xl:col-span-3">
          <div className="sticky top-6 space-y-4">
            <div className="rounded-2xl border border-[--border] bg-[--surface] p-4 shadow-xs">
              <div className="mb-4 flex items-center gap-2 border-b border-[--border]/40 pb-3">
                <SlidersHorizontal size={15} className="text-[--accent]" />
                <h3 className="text-sm font-bold text-[--foreground]">
                  Directory Filters
                </h3>
              </div>

              {/* Scope Toggles */}
              <div className="space-y-3">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-[--muted]">
                    Campus Scope
                  </label>
                  <div className="mt-1.5 flex flex-col gap-1">
                    <button
                      onClick={() => setSelectedCampusFilter("all")}
                      className={`flex items-center justify-between rounded-xl px-3 py-2.5 text-xs font-semibold transition-colors ${
                        selectedCampusFilter === "all"
                          ? "bg-[--accent]/10 text-[--accent]"
                          : "hover:bg-[--surface-secondary] text-[--muted] hover:text-[--foreground]"
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <Compass size={14} /> Global Directory
                      </span>
                      <Chip
                        size="sm"
                        variant="soft"
                        color={
                          selectedCampusFilter === "all" ? "accent" : "default"
                        }
                        className="text-[10px] font-bold"
                      >
                        {students.length}
                      </Chip>
                    </button>

                    {userCampus && (
                      <button
                        onClick={() => setSelectedCampusFilter("mine")}
                        className={`flex items-center justify-between rounded-xl px-3 py-2.5 text-xs font-semibold transition-colors ${
                          selectedCampusFilter === "mine"
                            ? "bg-[--accent]/10 text-[--accent]"
                            : "hover:bg-[--surface-secondary] text-[--muted] hover:text-[--foreground]"
                        }`}
                      >
                        <span className="flex items-center gap-2">
                          <GraduationCap size={14} /> My Campus
                        </span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Search Guidelines Helper Block */}
                <div className="rounded-xl bg-[--surface-secondary] p-3 text-[11px] text-[--muted] leading-relaxed border border-[--border]">
                  <span className="flex items-center gap-1 font-bold text-[--foreground] mb-1">
                    <HelpCircle size={12} className="text-[--accent]" /> Search
                    Tip
                  </span>
                  Refine network matches instantly by typing specific degree
                  certifications, personal taglines, handles, or native
                  institutions.
                </div>
              </div>
            </div>
          </div>
        </aside>

        {/* ── Right Main Stream (Toolbar & Result Grid) ── */}
        <section className="col-span-12 lg:col-span-8 xl:col-span-9 space-y-4">
          {/* Fluid Inline Layout Header (No background cards, borders, or outer shadows) */}
          <div className="flex items-center justify-between gap-2 px-0.5">
            <h2 className="flex items-center gap-2 text-lg font-bold text-[--foreground]">
              {query ? "Search Matches" : "Explore Network"}
              <span className="rounded-full bg-[--accent]/15 px-2 py-0.5 text-[10px] font-semibold text-[--accent]">
                {filteredStudents.length}
              </span>
            </h2>
            <InlineSearch
              value={query}
              onChange={setQuery}
              placeholder="Search matches..."
              label="Search users"
            />
          </div>

          {/* Conditional Rendering Framework Block */}
          {loading ? (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <Card
                  key={i}
                  className="border border-[--border] bg-[--surface] shadow-xs rounded-xl"
                >
                  <div className="p-5 space-y-4">
                    <div className="flex items-center gap-3">
                      <Skeleton className="h-12 w-12 rounded-xl" />
                      <div className="space-y-2 flex-1">
                        <Skeleton className="h-4 w-32 rounded" />
                        <Skeleton className="h-3 w-20 rounded" />
                      </div>
                    </div>
                    <Skeleton className="h-3 w-full rounded" />
                    <Skeleton className="h-3 w-2/3 rounded" />
                  </div>
                </Card>
              ))}
            </div>
          ) : filteredStudents.length === 0 ? (
            <Card className="border border-dashed border-[--border] bg-[--surface] shadow-xs rounded-xl">
              <div className="flex flex-col items-center py-20 text-center max-w-xs mx-auto">
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[--surface-secondary] text-[--muted] border border-[--border]">
                  <Search size={24} />
                </div>
                <h4 className="text-base font-bold text-[--foreground]">
                  No Classmates Found
                </h4>
                <p className="text-xs text-[--muted] mt-1 leading-normal">
                  We couldn&apos;t match any student profiles to your query
                  options. Adjust keywords or scope toggles.
                </p>
              </div>
            </Card>
          ) : (
            /* Card Grid Display */
            <ScrollShadow hideScrollBar>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                {filteredStudents.map((student) => {
                  const studentCampus = campuses.find(
                    (c) => c.id === student.campus,
                  );
                  const initials =
                    `${student.first_name?.[0] ?? ""}${student.last_name?.[0] ?? ""}`.toUpperCase();

                  return (
                    <Link
                      href={`/profile/${student.username}`}
                      key={student.id}
                      className="group block"
                    >
                      <Card className="h-full relative overflow-hidden border border-[--border] bg-[--surface] p-5 shadow-xs transition-all duration-200 hover:-translate-y-1 hover:border-[--accent]/40 hover:shadow-md rounded-xl">
                        <div className="absolute top-0 inset-x-0 h-1 bg-[--accent] opacity-0 group-hover:opacity-100 transition-opacity" />

                        <div className="flex items-start justify-between gap-2">
                          <Avatar className="h-14 w-14 rounded-xl shadow-xs border border-[--border] bg-[--surface-secondary] text-sm font-bold text-[--accent] shrink-0">
                            {student.avatar_url ? (
                              <Avatar.Image
                                src={student.avatar_url}
                                alt={student.username}
                              />
                            ) : (
                              initials || "?"
                            )}
                          </Avatar>

                          <div className="rounded-xl p-1.5 text-[--muted] opacity-0 group-hover:opacity-100 bg-[--surface-secondary] border border-[--border] transition-all">
                            <UserPlus size={14} className="text-[--accent]" />
                          </div>
                        </div>

                        <div className="mt-4 min-w-0">
                          <p className="truncate text-base font-bold text-[--foreground] group-hover:text-[--accent] transition-colors">
                            {student.first_name} {student.last_name}
                          </p>
                          <p className="truncate text-xs font-medium text-[--muted]">
                            @{student.username}
                          </p>

                          {student.major && (
                            <p className="mt-2.5 text-xs font-bold text-[--accent] truncate flex items-center gap-1">
                              <Sparkles size={12} className="shrink-0" />{" "}
                              {student.major}
                            </p>
                          )}

                          <p className="mt-2 line-clamp-2 text-xs text-[--muted] leading-relaxed min-h-9">
                            {student.headline ||
                              student.bio ||
                              "No bio description set yet."}
                          </p>
                        </div>

                        {studentCampus && (
                          <div className="mt-4 flex items-center gap-2 border-t border-[--border]/40 pt-3 min-w-0">
                            <CampusEmblem
                              campus={studentCampus}
                              className="size-5 rounded-md text-[8px] font-bold"
                            />
                            <span className="truncate text-[11px] font-medium text-[--muted] flex items-center gap-1">
                              <MapPin
                                size={11}
                                className="inline shrink-0 text-[--muted]/60"
                              />{" "}
                              {studentCampus.name}
                            </span>
                          </div>
                        )}
                      </Card>
                    </Link>
                  );
                })}
              </div>
            </ScrollShadow>
          )}
        </section>
      </div>
    </div>
  );
}
