import Link from "next/link";
import { notFound } from "next/navigation";
import Image from "next/image";
import { clubs } from "@/lib/clubs";

export default async function ClubPage({ params }: PageProps<"/clubs/[slug]">) {
  const { slug } = await params;
  const club = clubs.find((item) => item.id === slug);

  if (!club) notFound();

  return (
    <main className="site-shell">
      <header className="topbar">
        <Link href="/" className="wordmark" aria-label="Quad home">quad</Link>
        <nav className="main-nav" aria-label="Main navigation">
          <Link href="/#explore">Explore</Link>
          <Link href="/#calendar">Calendar</Link>
          <Link href="/#applications">My list</Link>
        </nav>
        <span className="ucla-label">UCLA / STUDENT CLUBS</span>
      </header>

      <article className="club-detail">
        <Link className="back-link" href="/#explore">← All clubs</Link>
        <p className="eyebrow club-detail-category">{club.category}</p>
        {club.logoUrl && <Image className="club-detail-logo" src={club.logoUrl} alt={`${club.name} logo`} width={72} height={72} unoptimized />}
        <h1>{club.name}</h1>

        <section className="club-about" aria-labelledby="club-about-heading">
          <h2 id="club-about-heading">About</h2>
          {club.description ? <p>{club.description}</p> : <div className="about-empty" aria-label="Description not provided yet" />}
        </section>

        <dl className="club-detail-facts">
          <div><dt>Time commitment</dt><dd>{club.commitment} hours / week</dd></div>
          <div><dt>Membership</dt><dd>{club.selectivity}</dd></div>
          <div><dt>Application</dt><dd>{club.application}</dd></div>
          <div><dt>Recruiting window</dt><dd>{club.recruitingWindow || "Not provided"}</dd></div>
          <div><dt>Time over a 10-week quarter</dt><dd>About {club.commitment * 10} hours</dd></div>
          <div><dt>Related majors</dt><dd>{club.majors.join(", ")}</dd></div>
        </dl>

        {club.website && (
          <div className="club-detail-links">
            <a href={club.website} target="_blank" rel="noreferrer">Visit club website ↗</a>
          </div>
        )}
      </article>
    </main>
  );
}
