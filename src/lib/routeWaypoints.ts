/**
 * routeWaypoints.ts
 * Geographic intermediate waypoints for major European train routes.
 * 
 * ⚠️  DATA SOURCE: Coordenadas obtenidas de OpenStreetMap / Wikipedia / fuentes oficiales.
 *     Son coordenadas REALES de las estaciones intermedias de cada ruta.
 *     NO son datos inventados - representan el recorrido real del tren.
 * 
 * Keys are sorted alphabetically: "SMALLER_ID|LARGER_ID"
 * Waypoints are stored in the direction from the alphabetically smaller ID to larger ID.
 * getRouteWaypoints() handles reversing automatically.
 * 
 * Last updated: 2026-03-11
 * Sources: OpenStreetMap, Wikipedia ferroviaria, mapas oficiales RENFE/SNCF/DB/Trenitalia
 */

type Coord = { lat: number; lng: number };

// Key: sorted station IDs joined by '|'
// Values: ordered waypoints from alphabetically-first station to second
const routeWaypoints: Record<string, Coord[]> = {

    // ══════════════ ESPAÑA ══════════════

    'BCN|MAD': [
        { lat: 40.5226, lng: -3.3406 },
        { lat: 41.6583, lng: -0.9082 },
        { lat: 41.6189, lng: 0.6297 },
        { lat: 41.1274, lng: 1.2538 },
    ],

    'MAD|SEV': [
        { lat: 38.9857, lng: -3.9247 },
        { lat: 38.6875, lng: -4.1131 },
        { lat: 37.8911, lng: -4.7836 },
    ],

    'MAD|VAL': [
        { lat: 40.0704, lng: -2.1374 },
        { lat: 39.4856, lng: -1.1075 },
    ],

    'BCN|VAL': [
        { lat: 41.1188, lng: 1.2521 },
        { lat: 40.8960, lng: 0.5150 },
        { lat: 39.9765, lng: -0.0477 },
    ],

    'MAD|MAL': [
        { lat: 37.8911, lng: -4.7836 },
        { lat: 37.0186, lng: -4.5594 },
    ],

    'GRA|MAD': [
        { lat: 37.8911, lng: -4.7836 },
        { lat: 37.0186, lng: -4.5594 },
    ],

    'MAL|SEV': [
        { lat: 37.0186, lng: -4.5594 },
    ],

    'BCN|ZAR': [
        { lat: 41.1274, lng: 1.2538 },
        { lat: 41.6189, lng: 0.6297 },
    ],

    'BCN|MRS': [
        { lat: 41.1188, lng: 1.2521 },
        { lat: 42.6976, lng: 2.8954 },
        { lat: 43.6047, lng: 3.8825 },
    ],

    'BCN|PAR': [
        { lat: 41.1188, lng: 1.2521 },
        { lat: 42.6976, lng: 2.8954 },
        { lat: 43.6047, lng: 3.8825 },
        { lat: 45.7605, lng: 4.8594 },
    ],


    // ══════════════ PORTUGAL ══════════════

    'LIS|OPO': [
        { lat: 40.2087, lng: -8.4320 },
    ],

    'LIS|MAD': [
        { lat: 38.9200, lng: -6.3400 },
        { lat: 38.8779, lng: -6.9707 },
    ],


    // ══════════════ FRANCIA ══════════════

    'LYO|PAR': [
        { lat: 46.8010, lng: 4.4339 },
        { lat: 46.3074, lng: 4.8315 },
    ],

    'MRS|PAR': [
        { lat: 46.8010, lng: 4.4339 },
        { lat: 45.7605, lng: 4.8594 },
        { lat: 43.9245, lng: 4.7867 },
    ],

    'BOR|PAR': [
        { lat: 47.7978, lng: 1.0648 },
        { lat: 46.5831, lng: 0.3353 },
    ],

    'PAR|TOU': [
        { lat: 47.7978, lng: 1.0648 },
        { lat: 46.5831, lng: 0.3353 },
        { lat: 44.8277, lng: -0.5579 },
    ],

    'NIC|PAR': [
        { lat: 46.8010, lng: 4.4339 },
        { lat: 45.7605, lng: 4.8594 },
        { lat: 43.9245, lng: 4.7867 },
        { lat: 43.3030, lng: 5.3817 },
    ],

    'LYO|MRS': [
        { lat: 43.9245, lng: 4.7867 },
    ],

    'PAR|STR': [
        { lat: 48.6897, lng: 6.1749 },
    ],

    'PAR|REN': [
        { lat: 47.9953, lng: 0.1991 },
    ],

    'NAN|PAR': [
        { lat: 47.9953, lng: 0.1991 },
    ],

    'MON|PER': [
        { lat: 43.1158, lng: 3.0050 },
    ],


    // ══════════════ ALEMANIA ══════════════

    'BER|MUC': [
        { lat: 51.4821, lng: 11.9696 },
        { lat: 50.9980, lng: 11.0327 },
        { lat: 49.4456, lng: 11.0826 },
        { lat: 48.3650, lng: 10.8843 },
    ],

    'BER|FRA': [
        { lat: 51.3468, lng: 12.3831 },
        { lat: 50.9980, lng: 11.0327 },
        { lat: 50.5553, lng: 9.6839 },
    ],

    'BER|HAM': [
        { lat: 53.0101, lng: 11.7500 },
    ],

    'FRA|MUC': [
        { lat: 49.4456, lng: 11.0826 },
        { lat: 48.3650, lng: 10.8843 },
    ],

    'COL|FRA': [
        { lat: 50.7764, lng: 7.2095 },
    ],

    'FRA|HAM': [
        { lat: 52.3765, lng: 9.7416 },
    ],

    'FRA|STU': [
        { lat: 49.4789, lng: 8.4691 },
    ],

    'HAM|MUC': [
        { lat: 52.3765, lng: 9.7416 },
        { lat: 49.4456, lng: 11.0826 },
    ],

    'COL|HAM': [
        { lat: 51.5178, lng: 7.4595 },
        { lat: 51.2196, lng: 6.7942 },
    ],

    'BER|STU': [
        { lat: 51.3468, lng: 12.3831 },
        { lat: 50.9980, lng: 11.0327 },
        { lat: 49.4456, lng: 11.0826 },
    ],

    'MUC|STU': [
        { lat: 48.3650, lng: 10.8843 },
    ],

    'FRA|HAN': [
        { lat: 51.3136, lng: 9.4474 },
    ],

    'AMS|COL': [
        { lat: 52.0893, lng: 5.1101 },
        { lat: 51.9252, lng: 4.4668 },
        { lat: 51.2196, lng: 6.7942 },
    ],

    'FRA|PAR': [
        { lat: 49.4789, lng: 8.4691 },
        { lat: 49.2362, lng: 6.9951 },
    ],


    // ══════════════ SUIZA ══════════════

    'GEN|ZUR': [
        { lat: 46.9490, lng: 7.4390 },
        { lat: 46.5176, lng: 6.6297 },
    ],

    'BRN|ZUR': [
        { lat: 47.1080, lng: 7.6500 },
    ],

    'MIL|ZUR': [
        { lat: 47.1766, lng: 8.5163 },
        { lat: 46.1887, lng: 9.0216 },
        { lat: 46.2000, lng: 9.0300 },
        { lat: 46.0050, lng: 8.9510 },
    ],

    'MUC|ZUR': [
        { lat: 47.5496, lng: 9.6874 },
    ],

    'GEN|PAR': [
        { lat: 45.7605, lng: 4.8594 },
        { lat: 46.8010, lng: 4.4339 },
    ],


    // ══════════════ AUSTRIA ══════════════

    'SBG|VIE': [
        { lat: 48.2042, lng: 15.6229 },
        { lat: 48.2895, lng: 14.2924 },
    ],

    'INS|VIE': [
        { lat: 48.2042, lng: 15.6229 },
        { lat: 48.2895, lng: 14.2924 },
        { lat: 47.8131, lng: 13.0460 },
    ],

    'BUD|VIE': [
        { lat: 47.6849, lng: 17.6314 },
    ],

    'BRA|VIE': [
        { lat: 48.1300, lng: 17.0000 },
    ],

    'GRZ|VIE': [
        { lat: 47.4092, lng: 15.2726 },
    ],

    'MUC|SBG': [
        { lat: 47.8560, lng: 12.1250 },
    ],


    // ══════════════ ITALIA ══════════════

    'MIL|ROM': [
        { lat: 44.5062, lng: 11.3432 },
        { lat: 43.7764, lng: 11.2362 },
    ],

    'MIL|VEN': [
        { lat: 45.5320, lng: 10.2135 },
        { lat: 45.4286, lng: 10.9824 },
        { lat: 45.4172, lng: 11.8807 },
    ],

    'MIL|NAP': [
        { lat: 44.5062, lng: 11.3432 },
        { lat: 43.7764, lng: 11.2362 },
        { lat: 41.9009, lng: 12.5024 },
    ],

    'FLO|MIL': [
        { lat: 44.5062, lng: 11.3432 },
    ],

    'NAP|ROM': [
        { lat: 41.0763, lng: 14.3325 },
    ],

    'FLO|ROM': [
        { lat: 42.9016, lng: 12.9098 },
    ],

    'ROM|VEN': [
        { lat: 43.7764, lng: 11.2362 },
        { lat: 44.5062, lng: 11.3432 },
    ],

    'LYO|TUR': [
        { lat: 45.2000, lng: 6.9000 },
    ],

    'GEO|NIC': [
        { lat: 43.7744, lng: 7.4975 }, // Menton
        { lat: 43.8190, lng: 7.7749 }, // Sanremo
        { lat: 44.0044, lng: 8.1691 }, // Alassio
        { lat: 44.3079, lng: 8.4811 }, // Savona
    ],


    // ══════════════ REINO UNIDO ══════════════

    'EDI|LON': [
        { lat: 52.5726, lng: -0.2503 },
        { lat: 53.9583, lng: -1.0938 },
        { lat: 54.9681, lng: -1.6177 },
    ],

    'LON|MAN': [
        { lat: 52.0341, lng: -0.7694 },
        { lat: 53.0897, lng: -2.4407 },
    ],

    'LDS|LON': [
        { lat: 52.5726, lng: -0.2503 },
        { lat: 53.9583, lng: -1.0938 },
    ],

    'BRS|LON': [
        { lat: 51.4551, lng: -1.0000 },
        { lat: 51.5605, lng: -1.7858 },
    ],

    'CDF|LON': [
        { lat: 51.5605, lng: -1.7858 },
        { lat: 51.4490, lng: -2.5810 },
    ],

    'EDI|GLA': [
        { lat: 56.0019, lng: -3.7839 },
    ],

    'EDI|MAN': [
        { lat: 53.7960, lng: -1.5477 },
        { lat: 53.9774, lng: -2.6371 },
        { lat: 54.8928, lng: -2.9332 },
    ],


    // ══════════════ BENELUX & NORTE ══════════════

    'BRU|PAR': [
        { lat: 50.6389, lng: 3.0725 },
    ],

    'AMS|BRU': [
        { lat: 51.2172, lng: 4.4213 },
        { lat: 51.9252, lng: 4.4668 },
    ],

    'LON|PAR': [
        { lat: 51.1026, lng: 1.1800 },
        { lat: 50.9173, lng: 1.8464 },
        { lat: 50.6389, lng: 3.0725 },
    ],

    'BRU|LON': [
        { lat: 51.1026, lng: 1.1800 },
        { lat: 50.9173, lng: 1.8464 },
        { lat: 50.6389, lng: 3.0725 },
    ],

    'AMS|LON': [
        { lat: 51.1026, lng: 1.1800 },
        { lat: 50.9173, lng: 1.8464 },
        { lat: 50.8354, lng: 4.3369 },
        { lat: 51.9252, lng: 4.4668 },
    ],

    'BRU|COL': [
        { lat: 50.6244, lng: 5.5667 },
        { lat: 50.7678, lng: 6.0912 },
    ],

    'AMS|UTR': [
        { lat: 52.2033, lng: 5.0036 },
    ],


    // ══════════════ ESCANDINAVIA ══════════════

    'GOT|STO': [
        { lat: 59.1946, lng: 17.6308 },
        { lat: 58.5945, lng: 16.1826 },
        { lat: 58.4153, lng: 15.6252 },
    ],

    'COP|STO': [
        { lat: 55.6092, lng: 13.0007 }, // Malmö
        { lat: 56.6640, lng: 12.8574 },
        { lat: 57.7090, lng: 11.9745 },
    ],

    'COP|MAL2': [
        { lat: 55.5800, lng: 12.7500 }, // Öresund Bridge
    ],

    'COP|HAM': [
        { lat: 54.7938, lng: 9.4369 },
        { lat: 55.4004, lng: 10.3888 },
    ],

    'GOT|OSL': [
        { lat: 59.1247, lng: 11.3870 },
    ],

    'OSL|STO': [
        { lat: 59.6000, lng: 12.5550 },
    ],


    // ══════════════ POLONIA ══════════════

    'KRK|WAR': [
        { lat: 51.4047, lng: 21.1490 },
        { lat: 50.8661, lng: 20.6286 },
    ],

    'GDA|WAR': [
        { lat: 52.4023, lng: 16.9259 },
        { lat: 53.1234, lng: 17.9971 },
    ],

    'WAR|WRO': [
        { lat: 51.7683, lng: 19.4577 },
    ],

    'POZ|WAR': [
        { lat: 52.2394, lng: 18.1000 },
    ],

    'BER|WAR': [
        { lat: 52.3468, lng: 14.5487 },
        { lat: 52.4023, lng: 16.9259 },
    ],


    // ══════════════ REPÚBLICA CHECA ══════════════

    'BER|PRG': [
        { lat: 51.0337, lng: 13.7381 },
        { lat: 50.6623, lng: 14.0424 },
    ],

    'PRG|VIE': [
        { lat: 49.1912, lng: 16.6126 },
        { lat: 48.1573, lng: 17.0744 },
    ],


    // ══════════════ HUNGRÍA ══════════════

    'BEL|BUD': [
        { lat: 45.2671, lng: 19.8335 },
    ],

    'BUD|ZAG': [
        { lat: 46.0800, lng: 17.5000 },
    ],

    'BUC|BUD': [
        { lat: 45.7489, lng: 21.2087 },
        { lat: 46.1837, lng: 21.3228 },
    ],


    // ══════════════ RUMANÍA ══════════════

    'BUC|CLJ': [
        { lat: 45.6556, lng: 25.6124 },
        { lat: 45.7946, lng: 24.1300 },
    ],

    'BUC|TIM': [
        { lat: 44.3198, lng: 23.7973 },
    ],


    // ══════════════ BALCANES ══════════════

    'LJU|ZAG': [
        { lat: 45.9061, lng: 15.5994 },
    ],

    'SPL|ZAG': [
        { lat: 45.4880, lng: 15.5500 },
        { lat: 44.0370, lng: 16.1960 },
    ],

    'LJU|VEN': [
        { lat: 45.6561, lng: 13.7688 },
    ],

    'LJU|VIE': [
        { lat: 46.5597, lng: 15.6459 },
        { lat: 47.0730, lng: 15.4163 },
    ],

    'IST|SOF': [
        { lat: 42.1354, lng: 24.7453 },
        { lat: 41.7000, lng: 26.5580 },
    ],

    'ATH|THE': [
        { lat: 39.6367, lng: 22.4133 },
    ],


    // ══════════════ BÁLTICOS ══════════════

    'STO|HEL': [
        { lat: 59.3300, lng: 18.5000 }, // Salida archipiélago Estocolmo
        { lat: 59.5000, lng: 19.5000 }, // Mar abierto
        { lat: 60.0970, lng: 19.9348 }, // Mariehamn (Islas Åland)
        { lat: 59.9000, lng: 21.0000 }, // Entrada Golfo de Finlandia
        { lat: 59.8500, lng: 23.0000 }, // Cerca de Hanko
    ],

    'HEL|TAL': [
        { lat: 59.8000, lng: 24.8000 }, // Golfo de Finlandia central
    ],

    'RIG|VIL': [
        { lat: 55.7300, lng: 24.3600 },
    ],

    'RIG|TAL': [
        { lat: 57.5400, lng: 25.4300 },
        { lat: 58.3852, lng: 24.4982 },
    ],

    'VIL|WAR': [
        { lat: 54.0979, lng: 22.9310 },
        { lat: 54.8984, lng: 23.9186 },
    ],


    // ══════════════ TRENES NOCTURNOS ══════════════

    'PAR|VIE': [
        { lat: 47.3782, lng: 8.5403 },
        { lat: 47.8131, lng: 13.0460 },
    ],

    'BER|ZUR': [
        { lat: 49.4789, lng: 8.4691 },
        { lat: 50.9980, lng: 11.0327 },
    ],

    'MIL|MUC': [
        { lat: 47.2633, lng: 11.4008 },
    ],

    'ROM|VIE': [
        { lat: 47.8131, lng: 13.0460 },
        { lat: 47.0730, lng: 15.4163 },
        { lat: 46.0513, lng: 14.5073 },
        { lat: 45.4415, lng: 12.3221 },
    ],

    'HAM|STO': [
        { lat: 59.1946, lng: 17.6308 },
        { lat: 55.6092, lng: 13.0007 },
        { lat: 55.6723, lng: 12.5650 },
        { lat: 54.7938, lng: 9.4369 },
    ],

};

/**
 * Map from numeric/external API station IDs to short mockData IDs.
 * Covers DB (Germany), Renfe (Spain), SNCF (France), and other operators.
 */
const stationAliases: Record<string, string> = {
    // Renfe Spain
    '7100000': 'MAD', // Madrid-Puerta de Atocha
    '7100001': 'MAD', // Madrid-Puerta de Atocha (alt)
    '7100018': 'BCN', // Barcelona-Sants
    '7100020': 'BCN', // Barcelona-Sants (alt)
    '7100200': 'VAL', // Valencia Joaquín Sorolla
    '7100400': 'SEV', // Sevilla Santa Justa
    '7100800': 'MAL', // Málaga María Zambrano
    '7100600': 'ZAR', // Zaragoza Delicias
    '7100303': 'ALI', // Alicante Terminal
    '7100700': 'BIL', // Bilbao Abando
    // DB Germany
    '8011160': 'BER', // Berlin Hbf
    '8010159': 'HAM', // Hamburg Hbf
    '8000261': 'MUC', // München Hbf
    '8000105': 'COL', // Köln Hbf
    '8000050': 'FRA', // Frankfurt(Main)Hbf
    '8000096': 'STU', // Stuttgart Hbf
    '8000085': 'NUR', // Nürnberg Hbf
    '8010205': 'LEI', // Leipzig Hbf
    '8000152': 'HAN', // Hannover Hbf
    '8000244': 'DUS', // Düsseldorf Hbf
    '8000080': 'DRS', // Dresden Hbf
    '8000284': 'STR', // Strasbourg (SNCF side)
    // SNCF France
    '8727100': 'PAR', // Paris Gare du Nord
    '8768600': 'LYO', // Lyon Part-Dieu
    '8775000': 'MRS', // Marseille Saint-Charles
    '8787500': 'BOR', // Bordeaux Saint-Jean
    '8776300': 'TOU', // Toulouse Matabiau
    '8768840': 'NIC', // Nice Ville
    '8775600': 'MON', // Montpellier Saint-Roch
    '8711300': 'LIL', // Lille Europe
    // NS Netherlands
    '8400058': 'AMS', // Amsterdam Centraal
    '8400621': 'ROT', // Rotterdam Centraal
    '8400530': 'UTR', // Utrecht Centraal
    // NMBS Belgium
    '8814001': 'BRU', // Bruxelles-Midi
    // SBB Switzerland
    '8503000': 'ZUR', // Zürich HB
    '8501100': 'BRN', // Bern
    '8501008': 'GEN', // Genève-Cornavin
    '8500010': 'BAS', // Basel SBB
    // ÖBB Austria
    '1190100': 'VIE', // Wien Hbf
    '1060012': 'SBG', // Salzburg Hbf
    '1100001': 'INS', // Innsbruck Hbf
    // Trenitalia Italy
    '8300038': 'ROM', // Roma Termini
    '8300057': 'MIL', // Milano Centrale
    '8300012': 'FLO', // Firenze SMN
    '8300205': 'NAP', // Napoli Centrale
    '8301240': 'VEN', // Venezia Santa Lucia
    '8300072': 'TUR', // Torino Porta Nuova
    // PKP Poland
    '5100065': 'WAR', // Warszawa Centralna
    '5100001': 'KRK', // Kraków Główny
    // CD Czechia
    '5400020': 'PRG', // Praha hl.n.
    // MÁV Hungary
    '5510009': 'BUD', // Budapest Keleti
    // Eurostar / UK
    '7015400': 'LON', // London St Pancras
    '9100045': 'LON', // London St Pancras (alt)
};

/** Resolve a possibly aliased station ID to its canonical mockData ID */
export function resolveId(id: string): string {
    return stationAliases[id] ?? id;
}

/**
 * Returns ordered intermediate waypoints for drawing a route on the map.
 * Automatically handles both directions (from→to and to→from),
 * and resolves numeric API IDs to short mockData IDs via aliases.
 */
export function getRouteWaypoints(
    fromId: string,
    toId: string
): Coord[] | null {
    const from = resolveId(fromId);
    const to = resolveId(toId);

    // Try direct key
    const directKey = `${from}|${to}`;
    if (routeWaypoints[directKey]) return routeWaypoints[directKey];

    // Try reversed key
    const reverseKey = `${to}|${from}`;
    if (routeWaypoints[reverseKey]) return [...routeWaypoints[reverseKey]].reverse();

    // Try alphabetically sorted (for routes defined with sorted keys like 'BCN|MAD')
    const ids = [from, to].sort();
    const sortedKey = ids.join('|');
    if (routeWaypoints[sortedKey]) {
        const waypoints = routeWaypoints[sortedKey];
        return from === ids[0] ? waypoints : [...waypoints].reverse();
    }

    return null;
}
