import { usePageLoading } from "@/lib/contexts/page-loading-context";
import { createSignal, createMemo } from "solid-js";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  FileDown,
  Loader2,
  ChevronDown,
  Users,
  User,
  FileText,
  FileSpreadsheet,
} from "@/components/icons";
import { toast } from "@/components/ui/sonner";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { formatDate, formatTime, getUserTimezone } from "@/lib/time-format";
type DtrExportProps = {
  orgId: string;
  members: Array<{
    userId: string;
    name: string;
    email: string;
    role: string;
  }>;
};
type TimeEntry = {
  id: number;
  userId: string;
  date: string;
  timeIn: string;
  timeOut: string | null;
  note: string | null;
  duration?: number;
};
export function DtrExport(props: DtrExportProps) {
  const [startDate, setStartDate] = createSignal("");
  const [endDate, setEndDate] = createSignal("");
  const [exporting, setExporting] = createSignal(false);
  const [selectedMember, setSelectedMember] = createSignal<string | null>(null);
  const [exportType, setExportType] = createSignal<"team" | "individual">(
    "team",
  );
  const [exportFormat, setExportFormat] = createSignal<"pdf" | "csv">("pdf");
  const handleExport = async () => {
    if (!startDate() || !endDate()) {
      toast.error("Please select both Date In and Date Out");
      return;
    }
    if (new Date(startDate()) > new Date(endDate())) {
      toast.error("Date In must be before Date Out");
      return;
    }
    if (exportType() === "individual" && !selectedMember()) {
      toast.error("Please select a member for individual export");
      return;
    }
    setExporting(true);
    try {
      const response = await fetch(`/api/admin/dtr-export`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          orgId: props.orgId,
          startDate: startDate(),
          endDate: endDate(),
          userId: exportType() === "individual" ? selectedMember() : undefined,
        }),
      });
      if (!response.ok) {
        throw new Error("Failed to fetch DTR data");
      }
      const data = await response.json();
      if (exportFormat() === "csv") {
        generateCSV(
          data,
          startDate(),
          endDate(),
          exportType() === "individual" ? selectedMember()! : undefined,
        );
      } else if (exportType() === "individual") {
        generateIndividualPDF(data, startDate(), endDate(), selectedMember()!);
      } else {
        generateTeamPDF(data, startDate(), endDate());
      }
      toast.success("DTR exported successfully!");
    } catch (error) {
      console.error("Export error:", error);
      toast.error("Failed to export DTR");
    } finally {
      setExporting(false);
    }
  };
  const escapeCSV = (value: string): string => {
    if (value.includes(",") || value.includes('"') || value.includes("\n")) {
      return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
  };
  const generateCSV = (
    data: Record<string, TimeEntry[]>,
    startDate: string,
    endDate: string,
    filterUserId?: string,
  ) => {
    const rows: string[] = ["Name,Email,Date,Time In,Time Out,Duration,Note"];
    const userIds = filterUserId ? [filterUserId] : Object.keys(data);
    for (const userId of userIds) {
      const entries = data[userId] || [];
      const member = props.members.find((m) => m.userId === userId);
      if (!member) continue;
      for (const entry of entries) {
        const duration = entry.duration
          ? `${Math.floor(entry.duration / 60)}h ${entry.duration % 60}m`
          : "";
        rows.push(
          [
            escapeCSV(member.name),
            escapeCSV(member.email),
            escapeCSV(formatDate(entry.date)),
            escapeCSV(
              formatTime(entry.timeIn, { hour: "2-digit", minute: "2-digit" }),
            ),
            entry.timeOut
              ? escapeCSV(
                  formatTime(entry.timeOut, {
                    hour: "2-digit",
                    minute: "2-digit",
                  }),
                )
              : "Active",
            duration,
            escapeCSV(entry.note || ""),
          ].join(","),
        );
      }
    }
    const csv = rows.join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const prefix = filterUserId
      ? (props.members.find((m) => m.userId === filterUserId)?.name || "member")
          .replace(/\s+/g, "-")
          .toLowerCase()
      : "team";
    a.href = url;
    a.download = `${prefix}-dtr-${startDate}-to-${endDate}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };
  const generateTeamPDF = (
    data: Record<string, TimeEntry[]>,
    startDate: string,
    endDate: string,
  ) => {
    const doc = new jsPDF();
    // Title
    doc.setFontSize(20);
    doc.text("Team DTR Report", 105, 20, { align: "center" });
    // Date range
    doc.setFontSize(12);
    doc.text(
      `Period: ${formatDate(startDate)} - ${formatDate(endDate)}`,
      105,
      30,
      { align: "center" },
    );
    doc.text(`Generated: ${formatDate(new Date().toISOString())}`, 105, 40, {
      align: "center",
    });
    doc.text(`Timezone: ${getUserTimezone()}`, 105, 50, { align: "center" });
    let yPosition = 70;
    // Process each member's data
    Object.entries(data).forEach(([userId, entries]) => {
      const member = props.members.find((m) => m.userId === userId);
      if (!member || entries.length === 0) return;
      // Member header
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text(`${member.name} (${member.email})`, 20, yPosition);
      yPosition += 10;
      // Create table data
      const tableData = entries.map((entry) => {
        const dateIn = formatDate(entry.date);
        const timeIn = formatTime(entry.timeIn, {
          hour: "2-digit",
          minute: "2-digit",
        });
        const dateOut = entry.timeOut ? formatDate(entry.timeOut) : "-";
        const timeOut = entry.timeOut
          ? formatTime(entry.timeOut, {
              hour: "2-digit",
              minute: "2-digit",
            })
          : "Active";
        const duration = entry.duration
          ? `${Math.floor(entry.duration / 60)}h ${entry.duration % 60}m`
          : "-";
        return [
          `${dateIn} ${timeIn}`,
          `${dateOut} ${timeOut}`,
          duration,
          entry.note || "-",
        ];
      });
      // Add table
      autoTable(doc, {
        head: [["Date & Time In", "Date & Time Out", "Duration", "Notes"]],
        body: tableData,
        startY: yPosition,
        margin: { left: 20, right: 20 },
        styles: { fontSize: 10 },
        headStyles: { fillColor: [66, 139, 202] },
        columnStyles: {
          0: { cellWidth: 40 }, // Date & Time In
          1: { cellWidth: 40 }, // Date & Time Out
          2: { cellWidth: 30 }, // Duration
          3: { cellWidth: 60 }, // Notes
        },
      });
      // Update position for next member - estimate based on table height
      const estimatedRowHeight = 8;
      const headerHeight = 10;
      const tableHeight =
        (tableData.length + 1) * estimatedRowHeight + headerHeight;
      yPosition += tableHeight + 20;
      // Add signature space for each member
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      // Check if we need more space for signature
      if (yPosition > 220) {
        doc.addPage();
        yPosition = 20;
      }
      // Signature line
      doc.line(20, yPosition, 120, yPosition);
      yPosition += 10;
      doc.text(`Employee Signature: ${member.name}`, 20, yPosition);
      yPosition += 5;
      doc.text(`Date: _______________`, 20, yPosition);
      yPosition += 30; // Extra space before next member
      // Add page break if needed for next member
      if (yPosition > 220) {
        doc.addPage();
        yPosition = 20;
      }
    });
    // Save the PDF
    const fileName = `team-dtr-${startDate}-to-${endDate}.pdf`;
    doc.save(fileName);
  };
  const generateIndividualPDF = (
    data: Record<string, TimeEntry[]>,
    startDate: string,
    endDate: string,
    userId: string,
  ) => {
    const member = props.members.find((m) => m.userId === userId);
    const entries = data[userId] || [];
    if (!member) {
      toast.error("Member not found");
      return;
    }
    const doc = new jsPDF();
    // Title
    doc.setFontSize(20);
    doc.text("Individual DTR Report", 105, 20, { align: "center" });
    // Member info
    doc.setFontSize(14);
    doc.text(`${member.name} (${member.email})`, 105, 30, { align: "center" });
    // Date range
    doc.setFontSize(12);
    doc.text(
      `Period: ${formatDate(startDate)} - ${formatDate(endDate)}`,
      105,
      40,
      { align: "center" },
    );
    doc.text(`Generated: ${formatDate(new Date().toISOString())}`, 105, 50, {
      align: "center",
    });
    doc.text(`Timezone: ${getUserTimezone()}`, 105, 60, { align: "center" });
    if (entries.length === 0) {
      doc.setFontSize(12);
      doc.text("No time entries found for the selected period.", 105, 80, {
        align: "center",
      });
    } else {
      // Create table data
      const tableData = entries.map((entry) => {
        const dateIn = formatDate(entry.date);
        const timeIn = formatTime(entry.timeIn, {
          hour: "2-digit",
          minute: "2-digit",
        });
        const dateOut = entry.timeOut ? formatDate(entry.timeOut) : "-";
        const timeOut = entry.timeOut
          ? formatTime(entry.timeOut, {
              hour: "2-digit",
              minute: "2-digit",
            })
          : "Active";
        const duration = entry.duration
          ? `${Math.floor(entry.duration / 60)}h ${entry.duration % 60}m`
          : "-";
        return [
          `${dateIn} ${timeIn}`,
          `${dateOut} ${timeOut}`,
          duration,
          entry.note || "-",
        ];
      });
      // Calculate total hours worked
      const totalMinutes = entries.reduce((sum, entry) => {
        return sum + (entry.duration || 0);
      }, 0);
      const totalHours = Math.floor(totalMinutes / 60);
      const remainingMinutes = totalMinutes % 60;
      // Add table
      autoTable(doc, {
        head: [["Date & Time In", "Date & Time Out", "Duration", "Notes"]],
        body: tableData,
        startY: 80,
        margin: { left: 20, right: 20 },
        styles: { fontSize: 10 },
        headStyles: { fillColor: [66, 139, 202] },
        columnStyles: {
          0: { cellWidth: 40 }, // Date & Time In
          1: { cellWidth: 40 }, // Date & Time Out
          2: { cellWidth: 30 }, // Duration
          3: { cellWidth: 60 }, // Notes
        },
        didDrawPage: function (data) {
          // Add total and signature space at the bottom of last page
          if (data.cursor) {
            let yPos = data.cursor.y + 20;
            // Total hours
            doc.setFontSize(12);
            doc.setFont("helvetica", "bold");
            doc.text(
              `Total Hours Worked: ${totalHours}h ${remainingMinutes}m`,
              20,
              yPos,
            );
            // Signature space
            yPos += 40;
            doc.setFontSize(10);
            doc.setFont("helvetica", "normal");
            // Signature line
            doc.line(20, yPos, 120, yPos);
            yPos += 10;
            doc.text(`Employee Signature: ${member.name}`, 20, yPos);
            yPos += 5;
            doc.text(`Date: _______________`, 20, yPos);
          }
        },
      });
    }
    // Save the PDF
    const fileName = `${member.name.replace(/\s+/g, "-").toLowerCase()}-dtr-${startDate}-to-${endDate}.pdf`;
    doc.save(fileName);
  };
  const getSelectedMemberName = () => {
    if (!selectedMember()) return "Select Member";
    const member = props.members.find((m) => m.userId === selectedMember());
    return member ? member.name : "Select Member";
  };
  usePageLoading(() => exporting());
  const view = createMemo(() => {
    return (
      <Card>
        <CardHeader>
          <CardTitle class="flex items-center gap-2">
            <FileDown class="h-5 w-5" />
            Export DTR
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div class="space-y-4">
            {/* Export Type Selection */}
            <div class="space-y-2">
              <Label>Export Type</Label>
              <div class="flex gap-2">
                <Button
                  variant={exportType() === "team" ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    setExportType("team");
                    setSelectedMember(null);
                  }}
                  class="flex items-center gap-2"
                >
                  <Users class="h-4 w-4" />
                  Team Export
                </Button>
                <Button
                  variant={
                    exportType() === "individual" ? "default" : "outline"
                  }
                  size="sm"
                  onClick={() => setExportType("individual")}
                  class="flex items-center gap-2"
                >
                  <User class="h-4 w-4" />
                  Individual Export
                </Button>
              </div>
            </div>

            {/* Member Selection for Individual Export */}
            {exportType() === "individual" && (
              <div class="space-y-2">
                <Label>Select Member</Label>
                <DropdownMenu class="block w-full min-w-0">
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" class="w-full justify-between">
                      <span class="truncate">{getSelectedMemberName()}</span>
                      <ChevronDown class="h-4 w-4 shrink-0" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent class="max-h-[min(24rem,50dvh)] w-full min-w-0 overflow-y-auto">
                    {props.members.map((member) => (
                      <DropdownMenuItem
                        onClick={() => setSelectedMember(member.userId)}
                      >
                        <div class="flex min-w-0 flex-col">
                          <span class="whitespace-normal break-words font-medium">
                            {member.name}
                          </span>
                        </div>
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            )}

            {/* Export Format */}
            <div class="space-y-2">
              <Label>Format</Label>
              <div class="flex gap-2">
                <Button
                  variant={exportFormat() === "pdf" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setExportFormat("pdf")}
                  class="flex items-center gap-2"
                >
                  <FileText class="h-4 w-4" />
                  PDF
                </Button>
                <Button
                  variant={exportFormat() === "csv" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setExportFormat("csv")}
                  class="flex items-center gap-2"
                >
                  <FileSpreadsheet class="h-4 w-4" />
                  CSV
                </Button>
              </div>
            </div>

            {/* Date Range Selection */}
            <div class="grid grid-cols-2 gap-4">
              <div class="space-y-2">
                <Label for="start-date">Date In</Label>
                <Input
                  id="start-date"
                  type="date"
                  value={startDate()}
                  onInput={(e) => setStartDate(e.target.value)}
                  class="w-full"
                />
              </div>
              <div class="space-y-2">
                <Label for="end-date">Date Out</Label>
                <Input
                  id="end-date"
                  type="date"
                  value={endDate()}
                  onInput={(e) => setEndDate(e.target.value)}
                  class="w-full"
                />
              </div>
            </div>

            <Button
              onClick={handleExport}
              disabled={
                exporting() ||
                !startDate() ||
                !endDate() ||
                (exportType() === "individual" && !selectedMember())
              }
              class="w-full"
            >
              {exporting() ? (
                <>
                  <Loader2 class="mr-2 h-4 w-4 animate-spin" />
                  Exporting...
                </>
              ) : (
                <>
                  <FileDown class="mr-2 h-4 w-4" />
                  Export {exportType() === "team" ? "Team" : "Individual"} DTR
                  to {exportFormat().toUpperCase()}
                </>
              )}
            </Button>

            <p class="text-sm text-muted-foreground text-center">
              {exportType() === "team"
                ? "Export time records for all team members from Date In to Date Out."
                : "Export time records for the selected member from Date In to Date Out."}{" "}
              All times are displayed in your local timezone.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  });
  return <>{view()}</>;
}
