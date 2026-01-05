import { Button } from "@/components/ui/button";
import { Download, FileJson } from "lucide-react";
import { 
    DropdownMenu, 
    DropdownMenuContent, 
    DropdownMenuItem, 
    DropdownMenuLabel, 
    DropdownMenuSeparator, 
    DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";

interface ExportButtonProps {
    onExportExcel: () => void;
    onExportTally?: () => void;
    label?: string;
    variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
    size?: "default" | "sm" | "lg" | "icon";
    disabled?: boolean;
}

export function ExportButton({ 
    onExportExcel, 
    onExportTally,
    label = "Export",
    variant = "outline",
    size = "sm",
    disabled = false
}: ExportButtonProps) {
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant={variant} size={size} disabled={disabled}>
                    <Download className="mr-2 h-4 w-4" />
                    {label}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuLabel>Export Options</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={onExportExcel}>
                    <FileJson className="mr-2 h-4 w-4 text-green-600" />
                    Export to Excel / CSV
                </DropdownMenuItem>
                {onExportTally && (
                    <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={onExportTally}>
                            <FileJson className="mr-2 h-4 w-4 text-orange-600" />
                            Export for Tally (XML)
                        </DropdownMenuItem>
                    </>
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
