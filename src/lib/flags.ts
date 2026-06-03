/** Convierte código ISO 2 letras a emoji de bandera */
export function isoToFlag(code: string): string {
  // Casos especiales (no tienen código ISO estándar de 2 letras)
  const special: Record<string, string> = {
    EN:  '🇬🇧',  // Inglaterra
    SCO: '🏴󠁧󠁢󠁳󠁣󠁴󠁿',
    WAL: '🏴󠁧󠁢󠁷󠁬󠁳󠁿',
    TBD: '🏳',
    TB:  '🏳',
    // Códigos incorrectos del seed → corregidos acá como fallback
    SW:  '🇸🇪',  // Sweden (guardado como SW en lugar de SE)
    CU:  '🇨🇼',  // Curaçao
  }
  if (special[code]) return special[code]
  if (code.length !== 2) return '🏳'

  // Construir emoji de bandera desde código ISO
  const offset = 0x1F1E6 - 65 // 'A'.charCodeAt(0) = 65
  const chars = [...code.toUpperCase()].map(c =>
    String.fromCodePoint(c.charCodeAt(0) + offset)
  )
  return chars.join('')
}

/** Nombre display de equipos — todos en español */
export function teamDisplayName(name: string): string {
  const map: Record<string, string> = {
    // Fútbol-data.org names → español
    'Korea Republic':       'Corea del Sur',
    'United States':        'EE.UU.',
    'Cape Verde Islands':   'Cabo Verde',
    'Congo DR':             'Congo RD',
    'DR Congo':             'Congo RD',
    'Ivory Coast':          'Costa de Marfil',
    'CuraÃ§ao':             'Curaçao',
    'Curaçao':              'Curaçao',
    'Saudi Arabia':         'Arabia Saudita',
    'South Africa':         'Sudáfrica',
    'New Zealand':          'Nueva Zelanda',
    'Czech Republic':       'Rep. Checa',
    'North Macedonia':      'N. Macedonia',
    'Bosnia-Herzegovina':   'Bosnia',
    'Bosnia and Herzegovina': 'Bosnia',
    'Morocco':              'Marruecos',
    'Switzerland':          'Suiza',
    'Netherlands':          'Países Bajos',
    'Portugal':             'Portugal',
    'Germany':              'Alemania',
    'France':               'Francia',
    'England':              'Inglaterra',
    'Spain':                'España',
    'Brazil':               'Brasil',
    'Argentina':            'Argentina',
    'Mexico':               'México',
    'Uruguay':              'Uruguay',
    'Colombia':             'Colombia',
    'Chile':                'Chile',
    'Ecuador':              'Ecuador',
    'Peru':                 'Perú',
    'Bolivia':              'Bolivia',
    'Paraguay':             'Paraguay',
    'Venezuela':            'Venezuela',
    'Costa Rica':           'Costa Rica',
    'Honduras':             'Honduras',
    'Panama':               'Panamá',
    'Haiti':                'Haití',
    'Jamaica':              'Jamaica',
    'Canada':               'Canadá',
    'Japan':                'Japón',
    'Australia':            'Australia',
    'Indonesia':            'Indonesia',
    'China PR':             'China',
    'China':                'China',
    'Iran':                 'Irán',
    'Iraq':                 'Irak',
    'Qatar':                'Catar',
    'Turkiye':              'Turquía',
    'Turkey':               'Turquía',
    'Serbia':               'Serbia',
    'Croatia':              'Croacia',
    'Poland':               'Polonia',
    'Belgium':              'Bélgica',
    'Denmark':              'Dinamarca',
    'Austria':              'Austria',
    'Ukraine':              'Ucrania',
    'Romania':              'Rumanía',
    'Scotland':             'Escocia',
    'Wales':                'Gales',
    'Georgia':              'Georgia',
    'Senegal':              'Senegal',
    'Ghana':                'Ghana',
    'Cameroon':             'Camerún',
    'Nigeria':              'Nigeria',
    'Egypt':                'Egipto',
    'Tunisia':              'Túnez',
    'Algeria':              'Argelia',
    'Mali':                 'Malí',
    'Gabon':                'Gabón',
    'Uganda':               'Uganda',
    'Tanzania':             'Tanzania',
    'Guinea':               'Guinea',
    'Sweden':               'Suecia',
    'Norway':               'Noruega',
    'Finland':              'Finlandia',
    'Slovakia':             'Eslovaquia',
    'Slovenia':             'Eslovenia',
    'Hungary':              'Hungría',
    'Greece':               'Grecia',
    'Albania':              'Albania',
    'Uzbekistan':           'Uzbekistán',
    'Jordan':               'Jordania',
    'Bahrain':              'Baréin',
    'Kuwait':               'Kuwait',
    'New Caledonia':        'Nueva Caledonia',
    'TBD':                  'Por definir',
  }
  return map[name] || name
}
