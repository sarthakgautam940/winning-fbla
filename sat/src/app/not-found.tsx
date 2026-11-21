import Link from "next/link";

export default function NotFound() {
  return (
    <div style={{ maxWidth: 560, margin: "18vh auto", padding: "0 20px" }}>
      <h1 className="title">Page not found</h1>
      <p className="subtitle">That page isn&apos;t part of the bank.</p>
      <Link className="btn" href="/" style={{ marginTop: 24 }}>
        Today
      </Link>
    </div>
  );
}
