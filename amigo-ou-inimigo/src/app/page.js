import Link from "next/link";

const steps = [
  {
    number: "01",
    title: "Crie seu evento",
    description:
      "Defina o nome da brincadeira e comece a montar seu grupo.",
  },
  {
    number: "02",
    title: "Convide seus amigos",
    description:
      "Envie convites por e-mail e acompanhe quem já entrou.",
  },
  {
    number: "03",
    title: "Faça o sorteio",
    description:
      "Cada participante recebe uma pessoa sem repetir ninguém.",
  },
  {
    number: "04",
    title: "Descubra seu resultado",
    description:
      "Cada pessoa vê apenas o próprio resultado, em segredo.",
  },
];

export default function HomePage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-5">
          <Link
            href="/"
            className="text-lg font-bold tracking-tight"
          >
            Amigo ou Inimigo
          </Link>

          <nav className="flex items-center gap-3">
            <Link
              href="/login"
              className="rounded-xl px-4 py-2 text-sm font-medium text-muted transition-colors hover:text-foreground"
            >
              Entrar
            </Link>

            <Link
              href="/register"
              className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-hover"
            >
              Criar conta
            </Link>
          </nav>
        </div>
      </header>

      <section className="mx-auto flex w-full max-w-6xl flex-col items-center px-6 pb-20 pt-24 text-center sm:pt-32">
        <div className="mb-6 inline-flex items-center rounded-full border border-border bg-surface px-4 py-2 text-sm text-muted">
          Uma brincadeira. Dois lados. Um resultado secreto.
        </div>

        <h1 className="max-w-4xl text-5xl font-bold tracking-tight sm:text-6xl">
          Seu amigo pode ser um{" "}
          <span className="text-friend">amigo</span>.
          <br />
          Ou pode ser um{" "}
          <span className="text-enemy">inimigo</span>.
        </h1>

        <p className="mt-6 max-w-2xl text-lg leading-8 text-muted">
          Crie seu evento, convide as pessoas, faça o sorteio e
          descubra quem ficou com quem. Cada participante vê
          apenas o próprio resultado.
        </p>

        <div className="mt-10 flex flex-col gap-3 sm:flex-row">
          <Link
            href="/register"
            className="rounded-2xl bg-primary px-7 py-3.5 text-base font-semibold text-white transition-colors hover:bg-primary-hover"
          >
            Criar minha conta
          </Link>

          <Link
            href="/login"
            className="rounded-2xl border border-border bg-surface px-7 py-3.5 text-base font-semibold transition-colors hover:bg-surface-hover"
          >
            Já tenho uma conta
          </Link>
        </div>
      </section>

      <section className="border-y border-border bg-surface/40">
        <div className="mx-auto w-full max-w-6xl px-6 py-20">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-wider text-primary">
              Como funciona
            </p>

            <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
              Do convite ao resultado em poucos passos.
            </h2>
          </div>

          <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {steps.map((step) => (
              <article
                key={step.number}
                className="rounded-2xl border border-border bg-surface p-6"
              >
                <span className="text-sm font-bold text-primary">
                  {step.number}
                </span>

                <h3 className="mt-5 text-lg font-semibold">
                  {step.title}
                </h3>

                <p className="mt-3 leading-7 text-muted">
                  {step.description}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-6 py-20">
        <div className="grid gap-6 md:grid-cols-2">
          <article className="rounded-3xl border border-border bg-surface p-8">
            <span className="inline-flex rounded-full bg-friend/10 px-3 py-1 text-sm font-semibold text-friend">
              AMIGO
            </span>

            <h2 className="mt-5 text-3xl font-bold">
              Uma surpresa boa.
            </h2>

            <p className="mt-4 leading-7 text-muted">
              Você pode receber alguém para presentear, agradar
              e fazer a brincadeira valer a pena.
            </p>
          </article>

          <article className="rounded-3xl border border-border bg-surface p-8">
            <span className="inline-flex rounded-full bg-enemy/10 px-3 py-1 text-sm font-semibold text-enemy">
              INIMIGO
            </span>

            <h2 className="mt-5 text-3xl font-bold">
              Ou uma surpresa... diferente.
            </h2>

            <p className="mt-4 leading-7 text-muted">
              Porque a graça do jogo está justamente em não
              saber qual dos dois lados vai aparecer.
            </p>
          </article>
        </div>
      </section>

      <section className="border-t border-border">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-center px-6 py-20 text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Pronto para descobrir?
          </h2>

          <p className="mt-4 max-w-xl text-muted">
            Crie sua conta e comece seu primeiro Amigo ou
            Inimigo.
          </p>

          <Link
            href="/register"
            className="mt-8 rounded-2xl bg-primary px-7 py-3.5 text-base font-semibold text-white transition-colors hover:bg-primary-hover"
          >
            Começar agora
          </Link>
        </div>
      </section>

      <footer className="border-t border-border">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-6 text-sm text-muted">
          <p>Amigo ou Inimigo</p>
          <p>Uma brincadeira entre amigos.</p>
        </div>
      </footer>
    </main>
  );
}