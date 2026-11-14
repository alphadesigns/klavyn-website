/**
 * The Klavyn "Portcullis" mark as drawing data, for places that draw the logo
 * in code (the social card) rather than loading /logo.svg. Keep these in step
 * with public/logo.svg, which is the master the PNG icons are rendered from.
 *
 * All paths share a 300 x 300 viewBox and are painted in this order: the
 * tile, the castle, the arch cut out of it, then the portcullis over the arch.
 */
export const logo = {
  viewBox: "0 0 300 300",
  tileRadius: 68,
  colors: {
    evergreen: "#123F3A",
    ivory: "#F7F5EF",
  },
  paths: {
    castle: "M40 235V125h30V98h30v27h30V78h40v47h30V98h30v27h30v110H40Z",
    arch: "M103 235v-50a47 47 0 0 1 94 0v50h-94Z",
    portcullis:
      "M120 130H131V196L125.5 208L120 196Z M144.5 130H155.5V196L150 208L144.5 196Z M169 130H180V196L174.5 208L169 196Z M100 164H200V174H100Z",
  },
} as const;
