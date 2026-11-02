export interface Issue {
  level: "error" | "warning";
  file: string;
  where: string;
  message: string;
}

export class Issues {
  list: Issue[] = [];

  error(file: string, where: string, message: string): void {
    this.list.push({ level: "error", file, where, message });
  }

  warn(file: string, where: string, message: string): void {
    this.list.push({ level: "warning", file, where, message });
  }

  get errors(): Issue[] {
    return this.list.filter((i) => i.level === "error");
  }

  get warnings(): Issue[] {
    return this.list.filter((i) => i.level === "warning");
  }

  print(filter?: (i: Issue) => boolean, limit = 400): void {
    const shown = filter ? this.list.filter(filter) : this.list;
    const byFile = new Map<string, Issue[]>();
    for (const i of shown) {
      const arr = byFile.get(i.file) ?? [];
      arr.push(i);
      byFile.set(i.file, arr);
    }
    let printed = 0;
    for (const [file, issues] of byFile) {
      console.log(`\n${file}`);
      for (const i of issues.sort((a, b) => (a.level === b.level ? 0 : a.level === "error" ? -1 : 1))) {
        if (printed >= limit) break;
        console.log(`  ${i.level === "error" ? "ERROR" : "warn "}  ${i.where}  ${i.message}`);
        printed += 1;
      }
    }
    if (shown.length > limit) console.log(`\n... ${shown.length - limit} more issues not shown`);
  }
}
