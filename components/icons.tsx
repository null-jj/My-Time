import type { JSX } from "@solidjs/web";
import { Dynamic } from "@solidjs/web";
import {
  AlertTriangle as AlertTriangleNode,
  BarChart3 as BarChart3Node,
  Building2 as Building2Node,
  Calendar as CalendarNode,
  Check as CheckNode,
  CheckCircle as CheckCircleNode,
  ChevronDown as ChevronDownNode,
  ChevronLeft as ChevronLeftNode,
  ChevronRight as ChevronRightNode,
  ChevronUp as ChevronUpNode,
  Circle as CircleNode,
  Clock as ClockNode,
  Copy as CopyNode,
  Download as DownloadNode,
  Droplets as DropletsNode,
  FileDown as FileDownNode,
  FileEdit as FileEditNode,
  FileSpreadsheet as FileSpreadsheetNode,
  FileText as FileTextNode,
  Flame as FlameNode,
  Heart as HeartNode,
  Home as HomeNode,
  KeyRound as KeyRoundNode,
  Leaf as LeafNode,
  Loader2 as Loader2Node,
  Mail as MailNode,
  Menu as MenuNode,
  MessageSquare as MessageSquareNode,
  Moon as MoonNode,
  Palette as PaletteNode,
  Play as PlayNode,
  Plus as PlusNode,
  Settings as SettingsNode,
  Shield as ShieldNode,
  Sparkles as SparklesNode,
  Square as SquareNode,
  Sun as SunNode,
  Trash2 as Trash2Node,
  TrendingUp as TrendingUpNode,
  User as UserNode,
  UserCheck as UserCheckNode,
  UserMinus as UserMinusNode,
  Users as UsersNode,
  X as XNode,
} from "lucide";
import type { IconNode } from "lucide";
type IconProps = JSX.SvgSVGAttributes<SVGSVGElement>;
function icon(nodes: IconNode) {
  return (props: IconProps) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
      {...props}
    >
      {nodes.map(([tag, attributes]) => (
        <Dynamic component={tag} {...attributes} />
      ))}
    </svg>
  );
}
export const AlertTriangle = icon(AlertTriangleNode);
export const BarChart3 = icon(BarChart3Node);
export const Building2 = icon(Building2Node);
export const Calendar = icon(CalendarNode);
export const Check = icon(CheckNode);
export const CheckCircle = icon(CheckCircleNode);
export const ChevronDown = icon(ChevronDownNode);
export const ChevronLeft = icon(ChevronLeftNode);
export const ChevronRight = icon(ChevronRightNode);
export const ChevronUp = icon(ChevronUpNode);
export const Circle = icon(CircleNode);
export const Clock = icon(ClockNode);
export const Copy = icon(CopyNode);
export const Download = icon(DownloadNode);
export const Droplets = icon(DropletsNode);
export const FileDown = icon(FileDownNode);
export const FileEdit = icon(FileEditNode);
export const FileSpreadsheet = icon(FileSpreadsheetNode);
export const FileText = icon(FileTextNode);
export const Flame = icon(FlameNode);
export const Heart = icon(HeartNode);
export const Home = icon(HomeNode);
export const KeyRound = icon(KeyRoundNode);
export const Leaf = icon(LeafNode);
export const Loader2 = icon(Loader2Node);
export const Mail = icon(MailNode);
export const Menu = icon(MenuNode);
export const MessageSquare = icon(MessageSquareNode);
export const Moon = icon(MoonNode);
export const Palette = icon(PaletteNode);
export const Play = icon(PlayNode);
export const Plus = icon(PlusNode);
export const Settings = icon(SettingsNode);
export const Shield = icon(ShieldNode);
export const Sparkles = icon(SparklesNode);
export const Square = icon(SquareNode);
export const Sun = icon(SunNode);
export const Trash2 = icon(Trash2Node);
export const TrendingUp = icon(TrendingUpNode);
export const User = icon(UserNode);
export const UserCheck = icon(UserCheckNode);
export const UserMinus = icon(UserMinusNode);
export const Users = icon(UsersNode);
export const X = icon(XNode);
