# Azerty Studio

Site de l'agence Azerty Studio.

## Structure

- `design/` — source de vérité importée de Claude Design (`Accueil.dc.html`, `support.js`, `assets/`). Ne pas modifier : ces fichiers servent de référence.
- `site/` — site statique (HTML + JS vanilla, sans dépendance) qui reproduit la page d'accueil de la maquette.
  - `index.html` — balisage repris de la maquette, sans le runtime Claude Design
  - `main.js` — interactions (animations, comparateur A/B, tarifs, clavier AZERTY, curseur)
  - `assets/` — images

## Voir le site en local

Ouvrir `site/` avec n'importe quel serveur statique, par exemple :

```bash
npx serve site
```
