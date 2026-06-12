import express from 'express';
import cors from 'cors';
import { siblings, clanLore } from './data/siblings.js';

const app = express();
const PORT = process.env.PORT ?? 3001;

app.use(cors());
app.use(express.json());

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', shrine: 'Santuário do Deserto do Clã Retsu' });
});

app.get('/api/clan', (_req, res) => {
  res.json(clanLore);
});

// Lista resumida dos 9 irmãos do juramento. Chosen não aparece aqui:
// ela é o segredo do santuário, acessível só por /api/lore/chosen.
app.get('/api/lore', (_req, res) => {
  const summaries = siblings
    .filter((s) => !s.hidden)
    .map(({ id, order, name, title, epithet, color, weapon }) => ({
      id,
      order,
      name,
      title,
      epithet,
      color,
      weapon: { name: weapon.name, type: weapon.type },
    }));
  res.json(summaries);
});

app.get('/api/lore/:siblingId', (req, res) => {
  const sibling = siblings.find((s) => s.id === req.params.siblingId);
  if (!sibling) {
    res.status(404).json({
      error: 'ARQUIVO_NAO_ENCONTRADO',
      message: 'A Biblioteca do Fim não guarda registros desse nome.',
    });
    return;
  }
  res.json(sibling);
});

app.listen(PORT, () => {
  console.log(`[Retsu] API ouvindo em http://localhost:${PORT}`);
});
