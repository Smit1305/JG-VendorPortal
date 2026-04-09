/**
 * Export utility — CSV download and print-to-PDF
 * No extra libraries required.
 */

/**
 * Download an array of objects as a CSV file.
 * @param {object[]} rows    - Array of plain objects (one per row)
 * @param {string[]} columns - Column keys to include (in order)
 * @param {string[]} headers - Human-readable header labels (same order as columns)
 * @param {string}   filename - File name without extension
 */
export function exportCSV(rows, columns, headers, filename = "export") {
  const escape = (val) => {
    const str = val === null || val === undefined ? "" : String(val);
    // Wrap in quotes if contains comma, quote, or newline
    return str.includes(",") || str.includes('"') || str.includes("\n")
      ? `"${str.replace(/"/g, '""')}"`
      : str;
  };

  const header = headers.map(escape).join(",");
  const body = rows
    .map((row) => columns.map((col) => escape(row[col])).join(","))
    .join("\n");

  const blob = new Blob([`${header}\n${body}`], { type: "text/csv;charset=utf-8;" });
  const url  = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href     = url;
  link.download = `${filename}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

/**
 * Print the current page as PDF via the browser's print dialog.
 * Passes a title that appears in the print header.
 * @param {string} title - Page title for the print document
 */
export function exportPDF(title = "Export") {
  const prevTitle = document.title;
  document.title  = title;
  window.print();
  document.title  = prevTitle;
}
