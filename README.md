# Regali

Webapp per la lista dei desideri condivisa della famiglia: wishlist personali, suggerimenti
di regalo per gli altri (che il destinatario non vede) e uno storico di chi ha regalato cosa.

## Funzioni

- **Accesso con nome e password.** La prima volta la password è il nome in minuscolo
  (es. `lorenzo`); si cambia dalla scheda *Account*.
- **Account iniziali:** Lorenzo (7/10/1992) ed Enrica (3/7/1993), entrambi amministratori.
  Vengono creati automaticamente al primo avvio.
- **Chiunque può creare nuovi account** (nome + data di nascita), visibili a tutti.
- **Amministratori:** possono eliminare gli account non amministratori e reimpostarne la password.
- **La mia wishlist:** aggiungi ciò che vorresti ricevere, con foto, link, prezzo e note.
  Qui vedi e modifichi solo ciò che hai aggiunto tu.
- **Suggerisci un regalo:** scegli un'altra persona e annota un'idea. Il destinatario non la vede.
- **Profilo di una persona:** i suoi desideri + i suggerimenti di tutti.
- **Segna come regalato:** chi l'ha fatto, l'occasione (Natale, compleanno, altro) e l'anno.
- **Storico:** tabella unica di tutti i regali fatti, filtrabile per persona, occasione e anno.
- **Condividi:** pulsante che invia il link dell'app (Web Share API o copia negli appunti).

## Tecnologia

Next.js 16 (App Router, Server Actions), Postgres (`pg`), sessioni firmate in cookie (`jose`),
password con `bcryptjs`. Le foto vengono ridimensionate nel browser e salvate nel database.
Lo schema viene creato automaticamente al primo accesso al database.

Lo stile segue le linee guida della skill `apple-design` (in `.claude/skills/apple-design`):
font di sistema, materiali traslucidi, sheet con trascinamento per chiudere, feedback alla
pressione, supporto a dark mode, reduced motion e reduced transparency.

## Sviluppo locale

```bash
cp .env.example .env.local   # imposta DATABASE_URL e SESSION_SECRET
npm install
npm run dev
```

## Pubblicazione

1. Crea un database Postgres (es. Supabase o Neon) e copia la stringa di connessione
   (su Supabase usa il *Transaction pooler*, porta 6543).
2. Importa il repository su Vercel e imposta le variabili d'ambiente `DATABASE_URL` e
   `SESSION_SECRET` (una stringa casuale lunga).
3. Al primo accesso vengono create le tabelle e gli account di Lorenzo ed Enrica.
