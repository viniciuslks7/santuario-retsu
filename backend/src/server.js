import express from 'express';
import cors from 'cors';

const app = express();
const PORT = process.env.PORT ?? 3001;

app.use(cors());
app.use(express.json());

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', shrine: 'Santuário do Deserto do Clã Retsu' });
});

// Passo 2: endpoints /api/lore e /api/lore/:siblingId entram aqui.

app.listen(PORT, () => {
  console.log(`[Retsu] API ouvindo em http://localhost:${PORT}`);
});
