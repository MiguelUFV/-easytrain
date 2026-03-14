import type { Station, Route } from '../types';
import { addHours, addMinutes } from 'date-fns';

// ═══════════════════════════════════════════════════════════════════════
// ~160 ESTACIONES — Red ferroviaria europea completa
// tier 1: Mega hubs (siempre visibles)
// tier 2: Ciudades grandes (zoom 5+)
// tier 3: Ciudades medias (zoom 6+)
// tier 4: Regionales (zoom 7+)
// ═══════════════════════════════════════════════════════════════════════

export const stations: Station[] = [
    // ══════════════ REINO UNIDO & IRLANDA ══════════════
    { id: 'LON', name: 'London St Pancras', city: 'Londres', country: 'Reino Unido', coordinates: { lat: 51.5322, lng: -0.1260 }, tier: 1 },
    { id: 'EDI', name: 'Edinburgh Waverley', city: 'Edimburgo', country: 'Reino Unido', coordinates: { lat: 55.9520, lng: -3.1890 }, tier: 2 },
    { id: 'MAN', name: 'Manchester Piccadilly', city: 'Manchester', country: 'Reino Unido', coordinates: { lat: 53.4774, lng: -2.2309 }, tier: 2 },
    { id: 'BHM', name: 'Birmingham New Street', city: 'Birmingham', country: 'Reino Unido', coordinates: { lat: 52.4778, lng: -1.9001 }, tier: 3 },
    { id: 'GLA', name: 'Glasgow Central', city: 'Glasgow', country: 'Reino Unido', coordinates: { lat: 55.8593, lng: -4.2584 }, tier: 3 },
    { id: 'CDF', name: 'Cardiff Central', city: 'Cardiff', country: 'Reino Unido', coordinates: { lat: 51.4754, lng: -3.1790 }, tier: 3 },
    { id: 'BRS', name: 'Bristol Temple Meads', city: 'Bristol', country: 'Reino Unido', coordinates: { lat: 51.4490, lng: -2.5810 }, tier: 3 },
    { id: 'LDS', name: 'Leeds City', city: 'Leeds', country: 'Reino Unido', coordinates: { lat: 53.7960, lng: -1.5477 }, tier: 3 },
    { id: 'LIV', name: 'Liverpool Lime Street', city: 'Liverpool', country: 'Reino Unido', coordinates: { lat: 53.4075, lng: -2.9778 }, tier: 3 },
    { id: 'NCL', name: 'Newcastle Central', city: 'Newcastle', country: 'Reino Unido', coordinates: { lat: 54.9685, lng: -1.6174 }, tier: 4 },
    { id: 'DUB', name: 'Dublin Heuston', city: 'Dublín', country: 'Irlanda', coordinates: { lat: 53.3464, lng: -6.2927 }, tier: 2 },
    { id: 'BEF', name: 'Belfast Central', city: 'Belfast', country: 'Irlanda del Norte', coordinates: { lat: 54.5952, lng: -5.9188 }, tier: 3 },
    { id: 'CRK', name: 'Cork Kent', city: 'Cork', country: 'Irlanda', coordinates: { lat: 51.9017, lng: -8.4580 }, tier: 4 },

    // ══════════════ FRANCIA ══════════════
    { id: 'PAR', name: 'Paris Gare du Nord', city: 'París', country: 'Francia', coordinates: { lat: 48.8821, lng: 2.3553 }, tier: 1 },
    { id: 'LYO', name: 'Lyon Part-Dieu', city: 'Lyon', country: 'Francia', coordinates: { lat: 45.7606, lng: 4.8596 }, tier: 2 },
    { id: 'MRS', name: 'Marseille Saint-Charles', city: 'Marsella', country: 'Francia', coordinates: { lat: 43.3028, lng: 5.3811 }, tier: 2 },
    { id: 'BOR', name: 'Bordeaux Saint-Jean', city: 'Burdeos', country: 'Francia', coordinates: { lat: 44.8256, lng: -0.5563 }, tier: 2 },
    { id: 'STR', name: 'Strasbourg Gare Centrale', city: 'Estrasburgo', country: 'Francia', coordinates: { lat: 48.5850, lng: 7.7350 }, tier: 3 },
    { id: 'LIL', name: 'Lille Europe', city: 'Lille', country: 'Francia', coordinates: { lat: 50.6390, lng: 3.0750 }, tier: 3 },
    { id: 'NIC', name: 'Nice Ville', city: 'Niza', country: 'Francia', coordinates: { lat: 43.7050, lng: 7.2620 }, tier: 3 },
    { id: 'TOU', name: 'Toulouse Matabiau', city: 'Toulouse', country: 'Francia', coordinates: { lat: 43.6115, lng: 1.4535 }, tier: 3 },
    { id: 'NAN', name: 'Nantes Gare', city: 'Nantes', country: 'Francia', coordinates: { lat: 47.2173, lng: -1.5418 }, tier: 3 },
    { id: 'MON', name: 'Montpellier Saint-Roch', city: 'Montpellier', country: 'Francia', coordinates: { lat: 43.6050, lng: 3.8803 }, tier: 3 },
    { id: 'REN', name: 'Rennes Gare', city: 'Rennes', country: 'Francia', coordinates: { lat: 48.1035, lng: -1.6720 }, tier: 3 },
    { id: 'DIJ', name: 'Dijon Ville', city: 'Dijon', country: 'Francia', coordinates: { lat: 47.3237, lng: 5.0270 }, tier: 4 },
    { id: 'AVG', name: 'Avignon TGV', city: 'Aviñón', country: 'Francia', coordinates: { lat: 43.9217, lng: 4.7863 }, tier: 4 },
    { id: 'PER', name: 'Perpignan Gare', city: 'Perpiñán', country: 'Francia', coordinates: { lat: 42.6976, lng: 2.8795 }, tier: 4 },

    // ══════════════ ESPAÑA ══════════════
    { id: 'MAD', name: 'Madrid Atocha', city: 'Madrid', country: 'España', coordinates: { lat: 40.4068, lng: -3.6907 }, tier: 1 },
    { id: 'BCN', name: 'Barcelona Sants', city: 'Barcelona', country: 'España', coordinates: { lat: 41.3791, lng: 2.1400 }, tier: 1 },
    { id: 'VAL', name: 'Valencia Joaquín Sorolla', city: 'Valencia', country: 'España', coordinates: { lat: 39.4650, lng: -0.3770 }, tier: 2 },
    { id: 'SEV', name: 'Sevilla Santa Justa', city: 'Sevilla', country: 'España', coordinates: { lat: 37.3920, lng: -5.9760 }, tier: 2 },
    { id: 'BIL', name: 'Bilbao Abando', city: 'Bilbao', country: 'España', coordinates: { lat: 43.2569, lng: -2.9236 }, tier: 3 },
    { id: 'MAL', name: 'Málaga María Zambrano', city: 'Málaga', country: 'España', coordinates: { lat: 36.7125, lng: -4.4310 }, tier: 3 },
    { id: 'ZAR', name: 'Zaragoza Delicias', city: 'Zaragoza', country: 'España', coordinates: { lat: 41.6592, lng: -0.9123 }, tier: 3 },
    { id: 'ALI', name: 'Alicante Terminal', city: 'Alicante', country: 'España', coordinates: { lat: 38.3447, lng: -0.4941 }, tier: 3 },
    { id: 'SAN', name: 'San Sebastián', city: 'San Sebastián', country: 'España', coordinates: { lat: 43.3186, lng: -1.9811 }, tier: 4 },
    { id: 'VIG', name: 'Vigo Guixar', city: 'Vigo', country: 'España', coordinates: { lat: 42.2346, lng: -8.7120 }, tier: 4 },
    { id: 'COR', name: 'A Coruña San Cristóbal', city: 'A Coruña', country: 'España', coordinates: { lat: 43.3540, lng: -8.3920 }, tier: 4 },
    { id: 'GRA', name: 'Granada Estación', city: 'Granada', country: 'España', coordinates: { lat: 37.1740, lng: -3.6090 }, tier: 4 },

    // ══════════════ PORTUGAL ══════════════
    { id: 'LIS', name: 'Lisboa Oriente', city: 'Lisboa', country: 'Portugal', coordinates: { lat: 38.7678, lng: -9.0991 }, tier: 1 },
    { id: 'OPO', name: 'Porto Campanhã', city: 'Oporto', country: 'Portugal', coordinates: { lat: 41.1496, lng: -8.5855 }, tier: 2 },
    { id: 'FAR', name: 'Faro Estação', city: 'Faro', country: 'Portugal', coordinates: { lat: 37.0194, lng: -7.9401 }, tier: 4 },
    { id: 'COI', name: 'Coimbra-B', city: 'Coímbra', country: 'Portugal', coordinates: { lat: 40.2107, lng: -8.4350 }, tier: 4 },

    // ══════════════ PAÍSES BAJOS ══════════════
    { id: 'AMS', name: 'Amsterdam Centraal', city: 'Ámsterdam', country: 'Países Bajos', coordinates: { lat: 52.3791, lng: 4.8994 }, tier: 1 },
    { id: 'ROT', name: 'Rotterdam Centraal', city: 'Róterdam', country: 'Países Bajos', coordinates: { lat: 51.9244, lng: 4.4690 }, tier: 3 },
    { id: 'UTR', name: 'Utrecht Centraal', city: 'Utrecht', country: 'Países Bajos', coordinates: { lat: 52.0893, lng: 5.1101 }, tier: 3 },
    { id: 'EIN', name: 'Eindhoven Centraal', city: 'Eindhoven', country: 'Países Bajos', coordinates: { lat: 51.4434, lng: 5.4815 }, tier: 4 },

    // ══════════════ BÉLGICA ══════════════
    { id: 'BRU', name: 'Bruxelles-Midi', city: 'Bruselas', country: 'Bélgica', coordinates: { lat: 50.8360, lng: 4.3370 }, tier: 1 },
    { id: 'ANT', name: 'Antwerpen-Centraal', city: 'Amberes', country: 'Bélgica', coordinates: { lat: 51.2172, lng: 4.4210 }, tier: 3 },
    { id: 'GHE', name: 'Gent-Sint-Pieters', city: 'Gante', country: 'Bélgica', coordinates: { lat: 51.0359, lng: 3.7109 }, tier: 4 },
    { id: 'BRG', name: 'Brugge', city: 'Brujas', country: 'Bélgica', coordinates: { lat: 51.1972, lng: 3.2169 }, tier: 4 },
    { id: 'LIE', name: 'Liège-Guillemins', city: 'Lieja', country: 'Bélgica', coordinates: { lat: 50.6244, lng: 5.5667 }, tier: 4 },

    // ══════════════ LUXEMBURGO ══════════════
    { id: 'LUX', name: 'Luxembourg Gare', city: 'Luxemburgo', country: 'Luxemburgo', coordinates: { lat: 49.5999, lng: 6.1342 }, tier: 3 },

    // ══════════════ ALEMANIA ══════════════
    { id: 'BER', name: 'Berlin Hauptbahnhof', city: 'Berlín', country: 'Alemania', coordinates: { lat: 52.5250, lng: 13.3694 }, tier: 1 },
    { id: 'MUC', name: 'München Hbf', city: 'Múnich', country: 'Alemania', coordinates: { lat: 48.1402, lng: 11.5583 }, tier: 1 },
    { id: 'FRA', name: 'Frankfurt (Main) Hbf', city: 'Fráncfort', country: 'Alemania', coordinates: { lat: 50.1071, lng: 8.6638 }, tier: 1 },
    { id: 'HAM', name: 'Hamburg Hbf', city: 'Hamburgo', country: 'Alemania', coordinates: { lat: 53.5530, lng: 10.0069 }, tier: 2 },
    { id: 'COL', name: 'Köln Hbf', city: 'Colonia', country: 'Alemania', coordinates: { lat: 50.9430, lng: 6.9590 }, tier: 2 },
    { id: 'STU', name: 'Stuttgart Hbf', city: 'Stuttgart', country: 'Alemania', coordinates: { lat: 48.7847, lng: 9.1818 }, tier: 2 },
    { id: 'DRS', name: 'Dresden Hbf', city: 'Dresde', country: 'Alemania', coordinates: { lat: 51.0400, lng: 13.7320 }, tier: 3 },
    { id: 'NUR', name: 'Nürnberg Hbf', city: 'Núremberg', country: 'Alemania', coordinates: { lat: 49.4454, lng: 11.0826 }, tier: 3 },
    { id: 'LEI', name: 'Leipzig Hbf', city: 'Leipzig', country: 'Alemania', coordinates: { lat: 51.3464, lng: 12.3816 }, tier: 3 },
    { id: 'HAN', name: 'Hannover Hbf', city: 'Hannover', country: 'Alemania', coordinates: { lat: 52.3770, lng: 9.7415 }, tier: 3 },
    { id: 'DUS', name: 'Düsseldorf Hbf', city: 'Düsseldorf', country: 'Alemania', coordinates: { lat: 51.2200, lng: 6.7940 }, tier: 3 },
    { id: 'BRE', name: 'Bremen Hbf', city: 'Bremen', country: 'Alemania', coordinates: { lat: 53.0835, lng: 8.8137 }, tier: 4 },
    { id: 'DOR', name: 'Dortmund Hbf', city: 'Dortmund', country: 'Alemania', coordinates: { lat: 51.5178, lng: 7.4595 }, tier: 4 },

    // ══════════════ SUIZA ══════════════
    { id: 'ZUR', name: 'Zürich HB', city: 'Zúrich', country: 'Suiza', coordinates: { lat: 47.3782, lng: 8.5403 }, tier: 1 },
    { id: 'GEN', name: 'Genève-Cornavin', city: 'Ginebra', country: 'Suiza', coordinates: { lat: 46.2100, lng: 6.1430 }, tier: 2 },
    { id: 'BRN', name: 'Bern', city: 'Berna', country: 'Suiza', coordinates: { lat: 46.9490, lng: 7.4390 }, tier: 2 },
    { id: 'BAS', name: 'Basel SBB', city: 'Basilea', country: 'Suiza', coordinates: { lat: 47.5476, lng: 7.5897 }, tier: 3 },
    { id: 'LUC', name: 'Luzern', city: 'Lucerna', country: 'Suiza', coordinates: { lat: 47.0502, lng: 8.3101 }, tier: 3 },
    { id: 'LAU', name: 'Lausanne', city: 'Lausana', country: 'Suiza', coordinates: { lat: 46.5170, lng: 6.6290 }, tier: 3 },
    { id: 'INT', name: 'Interlaken Ost', city: 'Interlaken', country: 'Suiza', coordinates: { lat: 46.6910, lng: 7.8690 }, tier: 4 },

    // ══════════════ AUSTRIA ══════════════
    { id: 'VIE', name: 'Wien Hbf', city: 'Viena', country: 'Austria', coordinates: { lat: 48.1860, lng: 16.3780 }, tier: 1 },
    { id: 'SBG', name: 'Salzburg Hbf', city: 'Salzburgo', country: 'Austria', coordinates: { lat: 47.8131, lng: 13.0460 }, tier: 2 },
    { id: 'INS', name: 'Innsbruck Hbf', city: 'Innsbruck', country: 'Austria', coordinates: { lat: 47.2633, lng: 11.4008 }, tier: 2 },
    { id: 'GRZ', name: 'Graz Hbf', city: 'Graz', country: 'Austria', coordinates: { lat: 47.0729, lng: 15.4165 }, tier: 3 },
    { id: 'LNZ', name: 'Linz Hbf', city: 'Linz', country: 'Austria', coordinates: { lat: 48.2903, lng: 14.2917 }, tier: 3 },

    // ══════════════ ITALIA ══════════════
    { id: 'ROM', name: 'Roma Termini', city: 'Roma', country: 'Italia', coordinates: { lat: 41.9009, lng: 12.5020 }, tier: 1 },
    { id: 'MIL', name: 'Milano Centrale', city: 'Milán', country: 'Italia', coordinates: { lat: 45.4858, lng: 9.2031 }, tier: 1 },
    { id: 'FLO', name: 'Firenze SMN', city: 'Florencia', country: 'Italia', coordinates: { lat: 43.7764, lng: 11.2484 }, tier: 2 },
    { id: 'NAP', name: 'Napoli Centrale', city: 'Nápoles', country: 'Italia', coordinates: { lat: 40.8531, lng: 14.2728 }, tier: 2 },
    { id: 'VEN', name: 'Venezia Santa Lucia', city: 'Venecia', country: 'Italia', coordinates: { lat: 45.4415, lng: 12.3210 }, tier: 2 },
    { id: 'TUR', name: 'Torino Porta Nuova', city: 'Turín', country: 'Italia', coordinates: { lat: 45.0614, lng: 7.6782 }, tier: 2 },
    { id: 'BOL', name: 'Bologna Centrale', city: 'Bolonia', country: 'Italia', coordinates: { lat: 44.5065, lng: 11.3430 }, tier: 3 },
    { id: 'GEO', name: 'Genova Piazza Principe', city: 'Génova', country: 'Italia', coordinates: { lat: 44.4153, lng: 8.9216 }, tier: 3 },
    { id: 'BAR2', name: 'Bari Centrale', city: 'Bari', country: 'Italia', coordinates: { lat: 41.1188, lng: 16.8716 }, tier: 3 },
    { id: 'VER', name: 'Verona Porta Nuova', city: 'Verona', country: 'Italia', coordinates: { lat: 45.4286, lng: 10.9824 }, tier: 3 },
    { id: 'PAD', name: 'Padova', city: 'Padua', country: 'Italia', coordinates: { lat: 45.4172, lng: 11.8807 }, tier: 4 },
    { id: 'PAL', name: 'Palermo Centrale', city: 'Palermo', country: 'Italia', coordinates: { lat: 38.1076, lng: 13.3654 }, tier: 4 },

    // ══════════════ POLONIA ══════════════
    { id: 'WAR', name: 'Warszawa Centralna', city: 'Varsovia', country: 'Polonia', coordinates: { lat: 52.2288, lng: 21.0033 }, tier: 1 },
    { id: 'KRK', name: 'Kraków Główny', city: 'Cracovia', country: 'Polonia', coordinates: { lat: 50.0680, lng: 19.9480 }, tier: 2 },
    { id: 'WRO', name: 'Wrocław Główny', city: 'Breslavia', country: 'Polonia', coordinates: { lat: 51.0989, lng: 17.0366 }, tier: 3 },
    { id: 'GDA', name: 'Gdańsk Główny', city: 'Gdansk', country: 'Polonia', coordinates: { lat: 54.3562, lng: 18.6444 }, tier: 3 },
    { id: 'POZ', name: 'Poznań Główny', city: 'Poznan', country: 'Polonia', coordinates: { lat: 52.4023, lng: 16.9118 }, tier: 3 },
    { id: 'KAT', name: 'Katowice', city: 'Katowice', country: 'Polonia', coordinates: { lat: 50.2577, lng: 19.0178 }, tier: 4 },
    { id: 'LOD', name: 'Łódź Fabryczna', city: 'Lodz', country: 'Polonia', coordinates: { lat: 51.7681, lng: 19.4613 }, tier: 4 },

    // ══════════════ REPÚBLICA CHECA ══════════════
    { id: 'PRG', name: 'Praha hl.n.', city: 'Praga', country: 'Rep. Checa', coordinates: { lat: 50.0833, lng: 14.4352 }, tier: 1 },
    { id: 'BRO', name: 'Brno hl.n.', city: 'Brno', country: 'Rep. Checa', coordinates: { lat: 49.1912, lng: 16.6126 }, tier: 3 },
    { id: 'OST', name: 'Ostrava hl.n.', city: 'Ostrava', country: 'Rep. Checa', coordinates: { lat: 49.8575, lng: 18.2700 }, tier: 4 },

    // ══════════════ ESLOVAQUIA ══════════════
    { id: 'BRA', name: 'Bratislava hl.st.', city: 'Bratislava', country: 'Eslovaquia', coordinates: { lat: 48.1578, lng: 17.1063 }, tier: 2 },
    { id: 'KOS', name: 'Košice', city: 'Košice', country: 'Eslovaquia', coordinates: { lat: 48.7164, lng: 21.2611 }, tier: 4 },

    // ══════════════ HUNGRÍA ══════════════
    { id: 'BUD', name: 'Budapest Keleti', city: 'Budapest', country: 'Hungría', coordinates: { lat: 47.5006, lng: 19.0839 }, tier: 1 },
    { id: 'DEB', name: 'Debrecen', city: 'Debrecen', country: 'Hungría', coordinates: { lat: 47.5316, lng: 21.6273 }, tier: 4 },

    // ══════════════ ESCANDINAVIA ══════════════
    { id: 'COP', name: 'København H', city: 'Copenhague', country: 'Dinamarca', coordinates: { lat: 55.6727, lng: 12.5650 }, tier: 1 },
    { id: 'AAR', name: 'Aarhus H', city: 'Aarhus', country: 'Dinamarca', coordinates: { lat: 56.1504, lng: 10.2048 }, tier: 4 },
    { id: 'STO', name: 'Stockholm Central', city: 'Estocolmo', country: 'Suecia', coordinates: { lat: 59.3308, lng: 18.0590 }, tier: 1 },
    { id: 'GOT', name: 'Göteborg Central', city: 'Gotemburgo', country: 'Suecia', coordinates: { lat: 57.7089, lng: 11.9733 }, tier: 2 },
    { id: 'MAL2', name: 'Malmö Central', city: 'Malmö', country: 'Suecia', coordinates: { lat: 55.6092, lng: 13.0007 }, tier: 3 },
    { id: 'OSL', name: 'Oslo S', city: 'Oslo', country: 'Noruega', coordinates: { lat: 59.9109, lng: 10.7523 }, tier: 1 },
    { id: 'BRG2', name: 'Bergen stasjon', city: 'Bergen', country: 'Noruega', coordinates: { lat: 60.3913, lng: 5.3340 }, tier: 3 },
    { id: 'TRD', name: 'Trondheim S', city: 'Trondheim', country: 'Noruega', coordinates: { lat: 63.4363, lng: 10.3990 }, tier: 4 },
    { id: 'HEL', name: 'Helsinki päärautatieasema', city: 'Helsinki', country: 'Finlandia', coordinates: { lat: 60.1718, lng: 24.9414 }, tier: 2 },
    { id: 'TMP', name: 'Tampere asema', city: 'Tampere', country: 'Finlandia', coordinates: { lat: 61.4982, lng: 23.7738 }, tier: 4 },
    { id: 'TKU', name: 'Turku asema', city: 'Turku', country: 'Finlandia', coordinates: { lat: 60.4540, lng: 22.2535 }, tier: 4 },

    // ══════════════ BÁLTICOS ══════════════
    { id: 'TAL', name: 'Tallinn Balti jaam', city: 'Tallin', country: 'Estonia', coordinates: { lat: 59.4400, lng: 24.7372 }, tier: 3 },
    { id: 'TAR', name: 'Tartu', city: 'Tartu', country: 'Estonia', coordinates: { lat: 58.3776, lng: 26.7290 }, tier: 4 },
    { id: 'RIG', name: 'Rīga Centrālā', city: 'Riga', country: 'Letonia', coordinates: { lat: 56.9503, lng: 24.1130 }, tier: 2 },
    { id: 'VIL', name: 'Vilnius stotis', city: 'Vilna', country: 'Lituania', coordinates: { lat: 54.6702, lng: 25.2847 }, tier: 2 },
    { id: 'KAU', name: 'Kaunas stotis', city: 'Kaunas', country: 'Lituania', coordinates: { lat: 54.8985, lng: 23.9180 }, tier: 4 },

    // ══════════════ BALCANES ══════════════
    { id: 'ATH', name: 'Athína Central', city: 'Atenas', country: 'Grecia', coordinates: { lat: 37.9838, lng: 23.7275 }, tier: 2 },
    { id: 'THE', name: 'Thessaloniki Station', city: 'Salónica', country: 'Grecia', coordinates: { lat: 40.6401, lng: 22.9444 }, tier: 3 },
    { id: 'PAT', name: 'Patras Station', city: 'Patras', country: 'Grecia', coordinates: { lat: 38.2444, lng: 21.7350 }, tier: 4 },
    { id: 'ZAG', name: 'Zagreb Glavni kolodvor', city: 'Zagreb', country: 'Croacia', coordinates: { lat: 45.8040, lng: 15.9790 }, tier: 2 },
    { id: 'SPL', name: 'Split kolodvor', city: 'Split', country: 'Croacia', coordinates: { lat: 43.5081, lng: 16.4412 }, tier: 3 },
    { id: 'RIJ', name: 'Rijeka kolodvor', city: 'Rijeka', country: 'Croacia', coordinates: { lat: 45.3284, lng: 14.4422 }, tier: 4 },
    { id: 'LJU', name: 'Ljubljana Glavna', city: 'Liubliana', country: 'Eslovenia', coordinates: { lat: 46.0583, lng: 14.5100 }, tier: 2 },
    { id: 'MRB', name: 'Maribor', city: 'Maribor', country: 'Eslovenia', coordinates: { lat: 46.5597, lng: 15.6459 }, tier: 4 },
    { id: 'BEL', name: 'Beograd Centar', city: 'Belgrado', country: 'Serbia', coordinates: { lat: 44.8203, lng: 20.4625 }, tier: 2 },
    { id: 'NIS', name: 'Niš', city: 'Niš', country: 'Serbia', coordinates: { lat: 43.3209, lng: 21.8958 }, tier: 4 },
    { id: 'NOV', name: 'Novi Sad', city: 'Novi Sad', country: 'Serbia', coordinates: { lat: 45.2671, lng: 19.8335 }, tier: 4 },
    { id: 'BUC', name: 'București Nord', city: 'Bucarest', country: 'Rumanía', coordinates: { lat: 44.4537, lng: 26.0788 }, tier: 2 },
    { id: 'CLJ', name: 'Cluj-Napoca', city: 'Cluj-Napoca', country: 'Rumanía', coordinates: { lat: 46.7712, lng: 23.5965 }, tier: 3 },
    { id: 'TIM', name: 'Timișoara Nord', city: 'Timisoara', country: 'Rumanía', coordinates: { lat: 45.7489, lng: 21.2087 }, tier: 3 },
    { id: 'BRV', name: 'Brașov', city: 'Brasov', country: 'Rumanía', coordinates: { lat: 45.6550, lng: 25.6012 }, tier: 4 },
    { id: 'SOF', name: 'Sofiya Tsentralna', city: 'Sofía', country: 'Bulgaria', coordinates: { lat: 42.7118, lng: 23.3209 }, tier: 2 },
    { id: 'PLV', name: 'Plovdiv', city: 'Plovdiv', country: 'Bulgaria', coordinates: { lat: 42.1354, lng: 24.7453 }, tier: 4 },
    { id: 'VAR', name: 'Varna', city: 'Varna', country: 'Bulgaria', coordinates: { lat: 43.2047, lng: 27.9116 }, tier: 4 },

    // ══════════════ MÁS BALCANES ══════════════
    { id: 'SAR', name: 'Sarajevo', city: 'Sarajevo', country: 'Bosnia', coordinates: { lat: 43.8563, lng: 18.4131 }, tier: 3 },
    { id: 'POD', name: 'Podgorica', city: 'Podgorica', country: 'Montenegro', coordinates: { lat: 42.4411, lng: 19.2636 }, tier: 3 },
    { id: 'BAR3', name: 'Bar', city: 'Bar', country: 'Montenegro', coordinates: { lat: 42.0938, lng: 19.1005 }, tier: 4 },
    { id: 'SKP', name: 'Skopje', city: 'Skopje', country: 'Macedonia del N.', coordinates: { lat: 41.9981, lng: 21.4254 }, tier: 3 },
    { id: 'TIR', name: 'Tiranë', city: 'Tirana', country: 'Albania', coordinates: { lat: 41.3275, lng: 19.8187 }, tier: 3 },

    // ══════════════ TURQUÍA ══════════════
    { id: 'IST', name: 'Istanbul Sirkeci', city: 'Estambul', country: 'Turquía', coordinates: { lat: 41.0153, lng: 28.9773 }, tier: 1 },
    { id: 'ANK', name: 'Ankara Gar', city: 'Ankara', country: 'Turquía', coordinates: { lat: 39.9401, lng: 32.8572 }, tier: 3 },

    // ══════════════ ESTACIONES REGIONALES EXTRA ══════════════
    // UK extra
    { id: 'YRK', name: 'York', city: 'York', country: 'Reino Unido', coordinates: { lat: 53.9583, lng: -1.0930 }, tier: 4 },
    { id: 'PBR', name: 'Peterborough', city: 'Peterborough', country: 'Reino Unido', coordinates: { lat: 52.5746, lng: -0.2500 }, tier: 4 },
    { id: 'EXE', name: 'Exeter St Davids', city: 'Exeter', country: 'Reino Unido', coordinates: { lat: 50.7268, lng: -3.5414 }, tier: 4 },
    { id: 'NTG', name: 'Nottingham', city: 'Nottingham', country: 'Reino Unido', coordinates: { lat: 52.9470, lng: -1.1466 }, tier: 4 },
    { id: 'SHF', name: 'Sheffield', city: 'Sheffield', country: 'Reino Unido', coordinates: { lat: 53.3780, lng: -1.4625 }, tier: 4 },
    // Francia extra
    { id: 'LMN', name: 'Le Mans', city: 'Le Mans', country: 'Francia', coordinates: { lat: 47.9959, lng: 0.1920 }, tier: 4 },
    { id: 'ANG', name: 'Angers Saint-Laud', city: 'Angers', country: 'Francia', coordinates: { lat: 47.4633, lng: -0.5565 }, tier: 4 },
    { id: 'TRS', name: 'Tours', city: 'Tours', country: 'Francia', coordinates: { lat: 47.3899, lng: 0.6937 }, tier: 4 },
    { id: 'POI', name: 'Poitiers', city: 'Poitiers', country: 'Francia', coordinates: { lat: 46.5828, lng: 0.3340 }, tier: 4 },
    { id: 'CLF', name: 'Clermont-Ferrand', city: 'Clermont-Ferrand', country: 'Francia', coordinates: { lat: 45.7791, lng: 3.1000 }, tier: 4 },
    { id: 'MET', name: 'Metz Ville', city: 'Metz', country: 'Francia', coordinates: { lat: 49.1099, lng: 6.1773 }, tier: 4 },
    { id: 'NAN2', name: 'Nancy Ville', city: 'Nancy', country: 'Francia', coordinates: { lat: 48.6895, lng: 6.1745 }, tier: 4 },
    { id: 'BAY', name: 'Bayonne', city: 'Bayona', country: 'Francia', coordinates: { lat: 43.4952, lng: -1.4742 }, tier: 4 },
    // Alemania extra
    { id: 'ROS', name: 'Rostock Hbf', city: 'Rostock', country: 'Alemania', coordinates: { lat: 54.0782, lng: 12.1307 }, tier: 4 },
    { id: 'KAS', name: 'Kassel-Wilhelmshöhe', city: 'Kassel', country: 'Alemania', coordinates: { lat: 51.3132, lng: 9.4477 }, tier: 4 },
    { id: 'MNZ', name: 'Mainz Hbf', city: 'Maguncia', country: 'Alemania', coordinates: { lat: 50.0012, lng: 8.2590 }, tier: 4 },
    { id: 'AUG', name: 'Augsburg Hbf', city: 'Augsburgo', country: 'Alemania', coordinates: { lat: 48.3656, lng: 10.8868 }, tier: 4 },
    { id: 'FRB', name: 'Freiburg (Breisgau) Hbf', city: 'Friburgo', country: 'Alemania', coordinates: { lat: 47.9974, lng: 7.8415 }, tier: 4 },
    { id: 'KIE', name: 'Kiel Hbf', city: 'Kiel', country: 'Alemania', coordinates: { lat: 54.3147, lng: 10.1319 }, tier: 4 },
    { id: 'WRZ', name: 'Würzburg Hbf', city: 'Wurzburgo', country: 'Alemania', coordinates: { lat: 49.8019, lng: 9.9368 }, tier: 4 },
    // Italia extra
    { id: 'PIS', name: 'Pisa Centrale', city: 'Pisa', country: 'Italia', coordinates: { lat: 43.7091, lng: 10.3988 }, tier: 4 },
    { id: 'ANO', name: 'Ancona', city: 'Ancona', country: 'Italia', coordinates: { lat: 43.6158, lng: 13.5115 }, tier: 4 },
    { id: 'PER2', name: 'Perugia', city: 'Perugia', country: 'Italia', coordinates: { lat: 43.1122, lng: 12.3888 }, tier: 4 },
    { id: 'SAL', name: 'Salerno', city: 'Salerno', country: 'Italia', coordinates: { lat: 40.6745, lng: 14.7710 }, tier: 4 },
    { id: 'TRI', name: 'Trieste Centrale', city: 'Trieste', country: 'Italia', coordinates: { lat: 45.6561, lng: 13.7688 }, tier: 4 },
    { id: 'BRE2', name: 'Brescia', city: 'Brescia', country: 'Italia', coordinates: { lat: 45.5320, lng: 10.2131 }, tier: 4 },
    // España extra
    { id: 'SAL2', name: 'Salamanca', city: 'Salamanca', country: 'España', coordinates: { lat: 40.9701, lng: -5.6639 }, tier: 4 },
    { id: 'OVI', name: 'Oviedo', city: 'Oviedo', country: 'España', coordinates: { lat: 43.3654, lng: -5.8524 }, tier: 4 },
    { id: 'GIJ', name: 'Gijón Cercanías', city: 'Gijón', country: 'España', coordinates: { lat: 43.5370, lng: -5.6711 }, tier: 4 },
    { id: 'CAS', name: 'Castellón', city: 'Castellón', country: 'España', coordinates: { lat: 39.9864, lng: -0.0513 }, tier: 4 },
    { id: 'MUR', name: 'Murcia del Carmen', city: 'Murcia', country: 'España', coordinates: { lat: 37.9753, lng: -1.1279 }, tier: 4 },
    { id: 'LEO', name: 'León', city: 'León', country: 'España', coordinates: { lat: 42.5987, lng: -5.5671 }, tier: 4 },
    { id: 'VAD', name: 'Valladolid-Campo Grande', city: 'Valladolid', country: 'España', coordinates: { lat: 41.6410, lng: -4.7269 }, tier: 4 },
    // Escandinavia extra
    { id: 'LIN', name: 'Linköping C', city: 'Linköping', country: 'Suecia', coordinates: { lat: 58.4153, lng: 15.6252 }, tier: 4 },
    { id: 'NOR', name: 'Norrköping C', city: 'Norrköping', country: 'Suecia', coordinates: { lat: 58.5945, lng: 16.1826 }, tier: 4 },
    { id: 'UPS', name: 'Uppsala C', city: 'Uppsala', country: 'Suecia', coordinates: { lat: 59.8582, lng: 17.6454 }, tier: 4 },
    { id: 'ODN', name: 'Odense', city: 'Odense', country: 'Dinamarca', coordinates: { lat: 55.4004, lng: 10.3887 }, tier: 4 },
    { id: 'STV', name: 'Stavanger', city: 'Stavanger', country: 'Noruega', coordinates: { lat: 58.9685, lng: 5.7340 }, tier: 4 },
    { id: 'DRA', name: 'Drammen', city: 'Drammen', country: 'Noruega', coordinates: { lat: 59.7440, lng: 10.2045 }, tier: 4 },
    // Polonia extra
    { id: 'SZC', name: 'Szczecin Główny', city: 'Szczecin', country: 'Polonia', coordinates: { lat: 53.4296, lng: 14.5537 }, tier: 4 },
    { id: 'LUB', name: 'Lublin', city: 'Lublin', country: 'Polonia', coordinates: { lat: 51.2290, lng: 22.5712 }, tier: 4 },
    { id: 'BYD', name: 'Bydgoszcz Główna', city: 'Bydgoszcz', country: 'Polonia', coordinates: { lat: 53.1322, lng: 17.9938 }, tier: 4 },
    // Rumanía extra
    { id: 'IAS', name: 'Iași', city: 'Iași', country: 'Rumanía', coordinates: { lat: 47.1585, lng: 27.5814 }, tier: 4 },
    { id: 'SIB', name: 'Sibiu', city: 'Sibiu', country: 'Rumanía', coordinates: { lat: 45.7983, lng: 24.1256 }, tier: 4 },
    // Hungría extra
    { id: 'SZE', name: 'Szeged', city: 'Szeged', country: 'Hungría', coordinates: { lat: 46.2494, lng: 20.1492 }, tier: 4 },
    { id: 'GYR', name: 'Győr', city: 'Győr', country: 'Hungría', coordinates: { lat: 47.6849, lng: 17.6314 }, tier: 4 },
    { id: 'PCS', name: 'Pécs', city: 'Pécs', country: 'Hungría', coordinates: { lat: 46.0727, lng: 18.2323 }, tier: 4 },
];

// ═══════════════════════════════════════════════════════════════════════
// ~250 RUTAS — Red ferroviaria europea completa
// ═══════════════════════════════════════════════════════════════════════

const baseDate = "2026-07-05T08:00:00.000Z";
type RouteType = 'HighSpeed' | 'Regional' | 'Intercity' | 'NightTrain';
let _id = 0;

const R = (
    from: string, to: string,
    hourOffset: number, durationMin: number,
    price: number, operator: string, type: RouteType = 'HighSpeed'
): Route => {
    _id++;
    const dep = addHours(new Date(baseDate), hourOffset).toISOString();
    const arrival = addMinutes(new Date(dep), durationMin).toISOString();
    const fromStation = stations.find(s => s.id === from);
    const toStation = stations.find(s => s.id === to);
    return {
        id: `R${_id}`,
        fromStationId: from, toStationId: to,
        fromStationName: fromStation?.name ?? from,
        toStationName: toStation?.name ?? to,
        departureTime: dep, arrivalTime: arrival,
        price, operator, type,
        occupancy: Math.round(Math.random() * 100) / 100,
    };
};

export const routes: Route[] = [

    // ══════════════════════════════════════
    // EUROSTAR — Canal de la Mancha
    // ══════════════════════════════════════
    R('LON', 'PAR', 0, 135, 120, 'Eurostar'),
    R('LON', 'BRU', 1, 120, 100, 'Eurostar'),
    R('LON', 'AMS', 2, 225, 140, 'Eurostar'),
    R('LON', 'LIL', 3, 80, 65, 'Eurostar'),

    // ══════════════════════════════════════
    // REINO UNIDO INTERNO
    // ══════════════════════════════════════
    R('LON', 'MAN', 0, 128, 75, 'Avanti West Coast'),
    R('LON', 'EDI', 1, 264, 110, 'LNER'),
    R('LON', 'BHM', 0, 85, 40, 'Avanti West Coast'),
    R('LON', 'BRS', 1, 105, 50, 'GWR'),
    R('LON', 'CDF', 2, 130, 55, 'GWR'),
    R('LON', 'LDS', 3, 135, 65, 'LNER'),
    R('MAN', 'EDI', 4, 195, 55, 'TransPennine', 'Intercity'),
    R('MAN', 'LIV', 5, 50, 15, 'Northern', 'Regional'),
    R('MAN', 'LDS', 6, 60, 20, 'TransPennine', 'Regional'),
    R('BHM', 'MAN', 7, 90, 30, 'Avanti West Coast'),
    R('EDI', 'GLA', 8, 50, 14, 'ScotRail', 'Regional'),
    R('EDI', 'NCL', 9, 90, 25, 'LNER', 'Intercity'),
    R('NCL', 'LDS', 10, 90, 25, 'TransPennine', 'Intercity'),
    R('LON', 'NCL', 11, 175, 80, 'LNER'),

    // ══════════════════════════════════════
    // IRLANDA
    // ══════════════════════════════════════
    R('DUB', 'CRK', 0, 165, 35, 'Irish Rail', 'Intercity'),
    R('DUB', 'BEF', 1, 125, 30, 'Enterprise', 'Intercity'),

    // ══════════════════════════════════════
    // THALYS / BENELUX
    // ══════════════════════════════════════
    R('PAR', 'BRU', 0, 82, 60, 'Thalys'),
    R('BRU', 'AMS', 1, 113, 45, 'Thalys'),
    R('AMS', 'ROT', 0, 40, 18, 'NS Intercity', 'Intercity'),
    R('ROT', 'BRU', 1, 68, 35, 'Thalys'),
    R('BRU', 'COL', 2, 110, 40, 'Thalys'),
    R('AMS', 'UTR', 0, 27, 10, 'NS Sprinter', 'Regional'),
    R('UTR', 'EIN', 1, 60, 15, 'NS Intercity', 'Intercity'),
    R('BRU', 'ANT', 0, 35, 12, 'NMBS IC', 'Intercity'),
    R('BRU', 'GHE', 1, 30, 10, 'NMBS IC', 'Intercity'),
    R('GHE', 'BRG', 2, 25, 8, 'NMBS IC', 'Regional'),
    R('BRU', 'LIE', 3, 50, 15, 'NMBS IC', 'Intercity'),
    R('BRU', 'LUX', 4, 190, 30, 'NMBS IC', 'Intercity'),
    R('LUX', 'STR', 5, 140, 25, 'CFL-SNCF', 'Intercity'),

    // ══════════════════════════════════════
    // TGV — FRANCIA
    // ══════════════════════════════════════
    R('PAR', 'LYO', 0, 120, 55, 'TGV inOui'),
    R('PAR', 'MRS', 1, 195, 85, 'TGV inOui'),
    R('PAR', 'BOR', 2, 130, 65, 'TGV inOui'),
    R('PAR', 'STR', 3, 105, 50, 'TGV inOui'),
    R('PAR', 'LIL', 0, 62, 30, 'TGV inOui'),
    R('PAR', 'NIC', 4, 330, 95, 'TGV inOui'),
    R('PAR', 'TOU', 5, 260, 70, 'TGV inOui'),
    R('PAR', 'NAN', 6, 135, 50, 'TGV inOui'),
    R('PAR', 'REN', 7, 90, 40, 'TGV inOui'),
    R('LYO', 'MRS', 8, 105, 40, 'TGV inOui'),
    R('LYO', 'GEN', 9, 110, 35, 'TGV Lyria'),
    R('LYO', 'MON', 10, 110, 30, 'TGV inOui'),
    R('MRS', 'NIC', 11, 155, 30, 'TER PACA', 'Regional'),
    R('MRS', 'MON', 12, 100, 20, 'TGV inOui'),
    R('MRS', 'AVG', 0, 30, 12, 'TER', 'Regional'),
    R('BOR', 'TOU', 13, 130, 30, 'TGV inOui'),
    R('TOU', 'MON', 14, 130, 25, 'Intercités', 'Intercity'),
    R('PAR', 'DIJ', 15, 100, 35, 'TGV inOui'),
    R('DIJ', 'LYO', 16, 110, 25, 'TER', 'Regional'),
    R('LYO', 'AVG', 17, 65, 20, 'TGV inOui'),
    R('MON', 'PER', 0, 90, 15, 'TER Occitanie', 'Regional'),
    R('PER', 'BCN', 1, 95, 25, 'Renfe-SNCF'),

    // ══════════════════════════════════════
    // AVE / RENFE — ESPAÑA
    // ══════════════════════════════════════
    R('MAD', 'BCN', 0, 155, 75, 'AVE'),
    R('MAD', 'SEV', 1, 150, 60, 'AVE'),
    R('MAD', 'VAL', 2, 100, 45, 'AVE'),
    R('MAD', 'MAL', 3, 155, 55, 'AVE'),
    R('MAD', 'BIL', 4, 295, 50, 'Renfe Alvia', 'Intercity'),
    R('MAD', 'ZAR', 5, 80, 35, 'AVE'),
    R('MAD', 'ALI', 6, 130, 40, 'AVE'),
    R('MAD', 'COR', 7, 300, 45, 'Renfe Alvia', 'Intercity'),
    R('MAD', 'GRA', 8, 180, 40, 'AVE'),
    R('BCN', 'VAL', 9, 175, 35, 'Euromed', 'Intercity'),
    R('BCN', 'ZAR', 10, 90, 25, 'AVE'),
    R('BCN', 'MRS', 11, 270, 50, 'Renfe-SNCF'),
    R('SEV', 'MAL', 12, 120, 25, 'AVE'),
    R('SEV', 'GRA', 13, 160, 25, 'Media Distancia', 'Regional'),
    R('VAL', 'ALI', 14, 110, 18, 'Euromed', 'Intercity'),
    R('BIL', 'SAN', 15, 60, 10, 'Cercanías', 'Regional'),
    R('COR', 'VIG', 16, 90, 12, 'Renfe MD', 'Regional'),

    // ══════════════════════════════════════
    // PORTUGAL
    // ══════════════════════════════════════
    R('LIS', 'OPO', 0, 170, 30, 'CP Alfa Pendular', 'Intercity'),
    R('OPO', 'LIS', 5, 170, 30, 'CP Alfa Pendular', 'Intercity'),
    R('MAD', 'LIS', 20, 570, 95, 'Lusitania', 'NightTrain'),
    R('LIS', 'SEV', 8, 390, 55, 'CP Internacional', 'Intercity'),
    R('LIS', 'FAR', 0, 180, 25, 'CP IC', 'Intercity'),
    R('LIS', 'COI', 1, 115, 18, 'CP IC', 'Intercity'),
    R('COI', 'OPO', 2, 65, 12, 'CP IC', 'Intercity'),
    R('OPO', 'VIG', 3, 120, 15, 'Celta', 'Regional'),

    // ══════════════════════════════════════
    // ICE — ALEMANIA
    // ══════════════════════════════════════
    R('BER', 'HAM', 0, 107, 55, 'ICE'),
    R('BER', 'MUC', 1, 240, 110, 'ICE'),
    R('BER', 'FRA', 2, 240, 90, 'ICE'),
    R('BER', 'DRS', 0, 120, 40, 'ICE'),
    R('BER', 'LEI', 1, 75, 30, 'ICE'),
    R('BER', 'HAN', 2, 100, 40, 'ICE'),
    R('HAM', 'COL', 3, 240, 70, 'ICE'),
    R('HAM', 'HAN', 4, 75, 30, 'ICE'),
    R('HAM', 'BRE', 5, 60, 20, 'ICE'),
    R('FRA', 'COL', 6, 62, 30, 'ICE'),
    R('FRA', 'STU', 7, 75, 25, 'ICE'),
    R('FRA', 'MUC', 8, 195, 65, 'ICE'),
    R('FRA', 'HAN', 9, 135, 45, 'ICE'),
    R('FRA', 'NUR', 10, 130, 40, 'ICE'),
    R('FRA', 'PAR', 11, 235, 100, 'ICE'),
    R('COL', 'AMS', 12, 160, 40, 'ICE'),
    R('COL', 'DUS', 13, 25, 12, 'ICE'),
    R('COL', 'DOR', 14, 75, 20, 'ICE'),
    R('STU', 'MUC', 15, 130, 35, 'ICE'),
    R('MUC', 'NUR', 16, 65, 25, 'ICE'),
    R('MUC', 'SBG', 17, 90, 25, 'DB', 'Regional'),
    R('MUC', 'INS', 18, 105, 30, 'DB', 'Regional'),
    R('NUR', 'LEI', 19, 185, 35, 'ICE'),
    R('LEI', 'DRS', 0, 80, 20, 'IC', 'Intercity'),
    R('HAN', 'BRE', 1, 65, 18, 'IC', 'Intercity'),
    R('DOR', 'DUS', 2, 45, 12, 'RE', 'Regional'),
    R('STR', 'FRA', 3, 85, 25, 'ICE'),
    R('STR', 'MUC', 4, 130, 35, 'ICE'),

    // ══════════════════════════════════════
    // SBB — SUIZA
    // ══════════════════════════════════════
    R('ZUR', 'BRN', 0, 58, 30, 'SBB IC'),
    R('ZUR', 'GEN', 1, 170, 50, 'SBB IC'),
    R('ZUR', 'BAS', 2, 55, 22, 'SBB IC'),
    R('ZUR', 'LUC', 3, 45, 18, 'SBB IR', 'Regional'),
    R('ZUR', 'MIL', 4, 205, 45, 'EC', 'Intercity'),
    R('ZUR', 'MUC', 5, 235, 55, 'EC', 'Intercity'),
    R('ZUR', 'STU', 6, 180, 40, 'IC', 'Intercity'),
    R('GEN', 'PAR', 7, 195, 80, 'TGV Lyria'),
    R('GEN', 'LAU', 0, 35, 12, 'SBB IR', 'Regional'),
    R('LAU', 'BRN', 1, 70, 20, 'SBB IC'),
    R('BRN', 'INT', 2, 55, 15, 'BLS', 'Regional'),
    R('BRN', 'BAS', 3, 55, 18, 'SBB IC'),
    R('BAS', 'STR', 4, 85, 20, 'SNCF TER', 'Regional'),
    R('BAS', 'FRA', 5, 180, 35, 'ICE'),

    // ══════════════════════════════════════
    // ÖBB — AUSTRIA
    // ══════════════════════════════════════
    R('VIE', 'SBG', 0, 145, 40, 'ÖBB Railjet'),
    R('VIE', 'INS', 1, 260, 55, 'ÖBB Railjet'),
    R('VIE', 'GRZ', 2, 155, 30, 'ÖBB Railjet'),
    R('VIE', 'LNZ', 3, 80, 25, 'ÖBB Railjet'),
    R('VIE', 'BUD', 4, 155, 30, 'ÖBB Railjet'),
    R('VIE', 'PRG', 5, 245, 35, 'ÖBB Railjet'),
    R('VIE', 'BRA', 6, 65, 15, 'ÖBB REX', 'Regional'),
    R('SBG', 'INS', 7, 110, 25, 'ÖBB', 'Regional'),
    R('SBG', 'MUC', 8, 90, 25, 'Meridian', 'Regional'),
    R('LNZ', 'SBG', 9, 70, 18, 'ÖBB', 'Regional'),
    R('GRZ', 'LJU', 10, 225, 25, 'ÖBB-SŽ', 'Intercity'),

    // ══════════════════════════════════════
    // TRENITALIA / ITALO — ITALIA
    // ══════════════════════════════════════
    R('MIL', 'ROM', 0, 175, 55, 'Frecciarossa'),
    R('ROM', 'MIL', 5, 175, 55, 'Italo'),
    R('MIL', 'FLO', 1, 105, 35, 'Frecciarossa'),
    R('MIL', 'VEN', 2, 145, 30, 'Frecciarossa'),
    R('MIL', 'TUR', 3, 55, 20, 'Frecciarossa'),
    R('MIL', 'BOL', 4, 65, 25, 'Frecciarossa'),
    R('MIL', 'GEO', 5, 90, 18, 'IC', 'Intercity'),
    R('FLO', 'ROM', 6, 90, 30, 'Italo'),
    R('FLO', 'BOL', 7, 35, 15, 'Frecciarossa'),
    R('ROM', 'NAP', 8, 70, 25, 'Italo'),
    R('ROM', 'FLO', 9, 90, 28, 'Frecciarossa'),
    R('ROM', 'BAR2', 10, 240, 40, 'Frecciargento', 'Intercity'),
    R('VEN', 'FLO', 11, 125, 30, 'Frecciarossa'),
    R('VEN', 'PAD', 0, 25, 8, 'RV', 'Regional'),
    R('VEN', 'VER', 1, 70, 15, 'RV', 'Regional'),
    R('VER', 'MIL', 2, 75, 18, 'Frecciarossa'),
    R('BOL', 'VEN', 3, 90, 20, 'Frecciarossa'),
    R('TUR', 'GEO', 4, 100, 15, 'IC', 'Intercity'),
    R('TUR', 'LYO', 5, 240, 45, 'Frecciarossa', 'Intercity'),
    R('GEO', 'NIC', 6, 180, 25, 'Thello', 'Intercity'),
    R('NAP', 'BAR2', 7, 240, 30, 'IC', 'Intercity'),
    R('NAP', 'PAL', 8, 540, 50, 'IC Notte', 'NightTrain'),

    // ══════════════════════════════════════
    // ESCANDINAVIA
    // ══════════════════════════════════════
    R('HAM', 'COP', 0, 290, 50, 'DSB-DB', 'Intercity'),
    R('COP', 'MAL2', 1, 35, 12, 'Öresundståg', 'Regional'),
    R('COP', 'AAR', 2, 190, 30, 'DSB IC', 'Intercity'),
    R('MAL2', 'GOT', 3, 175, 30, 'SJ', 'Intercity'),
    R('GOT', 'STO', 4, 185, 40, 'SJ Snabbtåg'),
    R('COP', 'STO', 5, 310, 65, 'SJ Snabbtåg'),
    R('OSL', 'GOT', 6, 225, 35, 'SJ-VY', 'Intercity'),
    R('OSL', 'STO', 7, 300, 55, 'SJ Snabbtåg'),
    R('OSL', 'BRG2', 8, 400, 45, 'VY Bergensbanen', 'Intercity'),
    R('OSL', 'TRD', 9, 390, 50, 'VY Dovrebanen', 'Intercity'),
    R('STO', 'HEL', 10, 960, 80, 'Viking Line + VR', 'NightTrain'),
    R('HEL', 'TMP', 0, 100, 18, 'VR IC', 'Intercity'),
    R('HEL', 'TKU', 1, 120, 15, 'VR IC', 'Intercity'),
    R('STO', 'MAL2', 2, 270, 40, 'SJ Snabbtåg'),

    // ══════════════════════════════════════
    // BÁLTICOS
    // ══════════════════════════════════════
    R('WAR', 'VIL', 0, 480, 30, 'LTG Link', 'Intercity'),
    R('VIL', 'RIG', 1, 265, 20, 'Rail Baltica', 'Intercity'),
    R('VIL', 'KAU', 0, 75, 8, 'LTG', 'Regional'),
    R('RIG', 'TAL', 2, 270, 20, 'Rail Baltica', 'Intercity'),
    R('TAL', 'HEL', 3, 120, 35, 'Tallink Ferry', 'Intercity'),
    R('TAL', 'TAR', 0, 140, 12, 'Elron', 'Regional'),

    // ══════════════════════════════════════
    // EUROPA CENTRAL — POLONIA, CHEQUIA, ESLOVAQUIA
    // ══════════════════════════════════════
    R('BER', 'WAR', 0, 340, 45, 'EC Berlin-Warszawa', 'Intercity'),
    R('WAR', 'KRK', 1, 145, 20, 'PKP IC', 'Intercity'),
    R('WAR', 'GDA', 2, 170, 25, 'PKP IC', 'Intercity'),
    R('WAR', 'POZ', 3, 180, 22, 'PKP IC', 'Intercity'),
    R('WAR', 'WRO', 4, 220, 25, 'PKP IC', 'Intercity'),
    R('WAR', 'LOD', 0, 75, 12, 'PKP IC', 'Intercity'),
    R('KRK', 'KAT', 1, 70, 8, 'PKP', 'Regional'),
    R('WRO', 'POZ', 2, 150, 15, 'PKP IC', 'Intercity'),
    R('PRG', 'BER', 0, 260, 40, 'EC', 'Intercity'),
    R('PRG', 'VIE', 1, 245, 35, 'RegioJet', 'Intercity'),
    R('PRG', 'BRO', 2, 150, 15, 'RegioJet', 'Intercity'),
    R('PRG', 'DRS', 3, 135, 20, 'EC', 'Intercity'),
    R('BRO', 'VIE', 4, 95, 15, 'RegioJet', 'Intercity'),
    R('BRO', 'BRA', 5, 80, 12, 'RegioJet', 'Intercity'),
    R('BRA', 'BUD', 6, 155, 18, 'EC', 'Intercity'),
    R('BRA', 'VIE', 7, 65, 12, 'REX', 'Regional'),
    R('OST', 'KAT', 0, 100, 10, 'Leo Express', 'Intercity'),
    R('KRK', 'PRG', 1, 420, 25, 'Leo Express', 'Intercity'),
    R('WRO', 'PRG', 2, 280, 20, 'Leo Express', 'Intercity'),

    // ══════════════════════════════════════
    // HUNGRÍA Y SURESTE
    // ══════════════════════════════════════
    R('BUD', 'BEL', 0, 470, 30, 'MÁV IC', 'Intercity'),
    R('BUD', 'ZAG', 1, 395, 25, 'MÁV-HŽ', 'Intercity'),
    R('BUD', 'BUC', 2, 540, 40, 'MÁV-CFR', 'Intercity'),
    R('BUD', 'VIE', 3, 155, 25, 'Railjet'),
    R('BUD', 'DEB', 0, 155, 12, 'MÁV IC', 'Intercity'),
    R('BUD', 'PRG', 4, 415, 35, 'EC', 'Intercity'),
    R('BUD', 'BRA', 5, 155, 15, 'EC', 'Intercity'),
    R('BEL', 'SOF', 6, 480, 25, 'BDŽ-SŽ', 'Intercity'),
    R('BEL', 'NOV', 0, 80, 8, 'SŽ', 'Regional'),
    R('BEL', 'NIS', 1, 180, 12, 'SŽ', 'Intercity'),
    R('BEL', 'BUC', 2, 720, 35, 'CFR', 'Intercity'),
    R('BEL', 'BAR3', 3, 660, 30, 'SŽ-ŽPCG', 'Intercity'),
    R('BEL', 'SAR', 4, 480, 22, 'SŽ-ŽFBH', 'Intercity'),
    R('NIS', 'SOF', 5, 240, 15, 'BDŽ', 'Intercity'),

    // ══════════════════════════════════════
    // RUMANÍA
    // ══════════════════════════════════════
    R('BUC', 'CLJ', 0, 480, 25, 'CFR IR', 'Intercity'),
    R('BUC', 'TIM', 1, 540, 28, 'CFR IR', 'Intercity'),
    R('BUC', 'BRV', 2, 170, 15, 'CFR IR', 'Intercity'),
    R('CLJ', 'TIM', 3, 300, 18, 'CFR IR', 'Intercity'),
    R('TIM', 'BEL', 4, 240, 15, 'CFR-SŽ', 'Intercity'),
    R('BUC', 'SOF', 5, 600, 25, 'CFR-BDŽ', 'Intercity'),

    // ══════════════════════════════════════
    // BULGARIA
    // ══════════════════════════════════════
    R('SOF', 'PLV', 0, 150, 10, 'BDŽ', 'Intercity'),
    R('SOF', 'VAR', 1, 420, 18, 'BDŽ', 'Intercity'),
    R('SOF', 'THE', 2, 420, 20, 'OSE-BDŽ', 'Intercity'),
    R('SOF', 'IST', 3, 540, 30, 'TCDD', 'Intercity'),
    R('PLV', 'IST', 4, 420, 25, 'TCDD', 'Intercity'),

    // ══════════════════════════════════════
    // GRECIA
    // ══════════════════════════════════════
    R('THE', 'ATH', 0, 260, 25, 'Hellenic Train', 'Intercity'),
    R('ATH', 'PAT', 1, 210, 15, 'Hellenic Train', 'Intercity'),
    R('THE', 'SKP', 2, 300, 15, 'OSE', 'Intercity'),

    // ══════════════════════════════════════
    // ESLOVENIA / CROACIA
    // ══════════════════════════════════════
    R('VEN', 'LJU', 0, 240, 25, 'SŽ-Trenitalia', 'Intercity'),
    R('LJU', 'ZAG', 1, 140, 15, 'SŽ-HŽ', 'Intercity'),
    R('LJU', 'VIE', 2, 360, 40, 'ÖBB EC', 'Intercity'),
    R('LJU', 'MRB', 3, 110, 10, 'SŽ', 'Regional'),
    R('MRB', 'GRZ', 4, 100, 12, 'SŽ-ÖBB', 'Regional'),
    R('ZAG', 'SPL', 5, 340, 25, 'HŽ IC', 'Intercity'),
    R('ZAG', 'RIJ', 6, 250, 18, 'HŽ IC', 'Intercity'),
    R('ZAG', 'SAR', 7, 540, 20, 'HŽ-ŽFBH', 'Intercity'),

    // ══════════════════════════════════════
    // MONTENEGRO, BOSNIA, N. MACEDONIA, ALBANIA
    // ══════════════════════════════════════
    R('BAR3', 'POD', 0, 60, 5, 'ŽPCG', 'Regional'),
    R('POD', 'SKP', 1, 420, 15, 'ŽPCG-MŽ', 'Intercity'),
    R('SAR', 'POD', 2, 480, 18, 'ŽFBH-ŽPCG', 'Intercity'),
    R('SKP', 'SOF', 3, 360, 15, 'MŽ-BDŽ', 'Intercity'),
    R('SKP', 'THE', 4, 300, 12, 'MŽ-OSE', 'Intercity'),

    // ══════════════════════════════════════
    // TURQUÍA
    // ══════════════════════════════════════
    R('IST', 'ANK', 0, 265, 50, 'YHT'),
    R('THE', 'IST', 1, 540, 30, 'TCDD', 'Intercity'),

    // ══════════════════════════════════════
    // NOCTURNOS / NIGHTJET
    // ══════════════════════════════════════
    R('PAR', 'VIE', 20, 780, 70, 'ÖBB Nightjet', 'NightTrain'),
    R('ZUR', 'BER', 21, 600, 50, 'ÖBB Nightjet', 'NightTrain'),
    R('MIL', 'MUC', 22, 540, 45, 'ÖBB Nightjet', 'NightTrain'),
    R('BCN', 'PAR', 23, 780, 60, 'Renfe-SNCF Noche', 'NightTrain'),
    R('BER', 'BUD', 22, 660, 45, 'ÖBB Nightjet', 'NightTrain'),
    R('VIE', 'ROM', 21, 720, 50, 'ÖBB Nightjet', 'NightTrain'),
    R('VIE', 'HAM', 20, 540, 45, 'ÖBB Nightjet', 'NightTrain'),
    R('ZUR', 'PRG', 22, 660, 50, 'ÖBB Nightjet', 'NightTrain'),
    R('BRU', 'VIE', 21, 780, 55, 'ÖBB Nightjet', 'NightTrain'),
    R('PAR', 'BER', 22, 600, 60, 'ÖBB Nightjet', 'NightTrain'),
    R('MUC', 'ROM', 20, 660, 50, 'ÖBB Nightjet', 'NightTrain'),
    R('AMS', 'ZUR', 21, 720, 55, 'ÖBB Nightjet', 'NightTrain'),
    R('HAM', 'ZUR', 22, 600, 45, 'ÖBB Nightjet', 'NightTrain'),
    R('STO', 'HAM', 20, 840, 70, 'Snälltåget', 'NightTrain'),
    R('MAD', 'LIS', 21, 570, 65, 'Lusitania', 'NightTrain'),
    R('BEL', 'BAR3', 22, 660, 30, 'SŽ-ŽPCG', 'NightTrain'),

    // ══════════════════════════════════════════════════
    // REGIONALES UK
    // ══════════════════════════════════════════════════
    R('LON', 'PBR', 0, 50, 20, 'LNER', 'Regional'),
    R('PBR', 'YRK', 1, 85, 25, 'LNER', 'Regional'),
    R('YRK', 'EDI', 2, 150, 40, 'LNER', 'Intercity'),
    R('YRK', 'LDS', 3, 25, 8, 'Northern', 'Regional'),
    R('LDS', 'SHF', 4, 40, 10, 'Northern', 'Regional'),
    R('SHF', 'NTG', 5, 55, 12, 'East Midlands', 'Regional'),
    R('NTG', 'BHM', 6, 70, 15, 'East Midlands', 'Regional'),
    R('LON', 'EXE', 7, 140, 45, 'GWR', 'Intercity'),
    R('EXE', 'BRS', 8, 75, 18, 'GWR', 'Regional'),
    R('BRS', 'CDF', 9, 55, 15, 'GWR', 'Regional'),
    R('MAN', 'SHF', 10, 50, 12, 'Northern', 'Regional'),
    R('LIV', 'LDS', 11, 100, 22, 'TransPennine', 'Regional'),
    R('NCL', 'EDI', 0, 90, 22, 'LNER', 'Regional'),
    R('BHM', 'NTG', 1, 50, 10, 'East Midlands', 'Regional'),
    R('BHM', 'BRS', 2, 85, 18, 'CrossCountry', 'Regional'),

    // ══════════════════════════════════════════════════
    // REGIONALES FRANCIA (TER)
    // ══════════════════════════════════════════════════
    R('PAR', 'LMN', 0, 55, 25, 'TGV inOui', 'Regional'),
    R('LMN', 'REN', 1, 65, 18, 'TER Bretagne', 'Regional'),
    R('LMN', 'ANG', 2, 40, 12, 'TER PdL', 'Regional'),
    R('ANG', 'NAN', 3, 40, 10, 'TER PdL', 'Regional'),
    R('PAR', 'TRS', 4, 70, 22, 'TGV', 'Regional'),
    R('TRS', 'POI', 5, 55, 15, 'TER Centre', 'Regional'),
    R('POI', 'BOR', 6, 100, 25, 'TER NA', 'Regional'),
    R('LYO', 'CLF', 7, 130, 22, 'TER AURA', 'Regional'),
    R('CLF', 'MON', 8, 210, 28, 'Intercités', 'Regional'),
    R('PAR', 'MET', 9, 82, 30, 'TGV Est', 'Regional'),
    R('MET', 'NAN2', 10, 35, 10, 'TER GE', 'Regional'),
    R('NAN2', 'STR', 11, 90, 18, 'TER GE', 'Regional'),
    R('MET', 'LUX', 12, 50, 12, 'TER-CFL', 'Regional'),
    R('BOR', 'BAY', 13, 115, 20, 'TER NA', 'Regional'),
    R('BAY', 'SAN', 14, 45, 12, 'SNCF-Renfe', 'Regional'),
    R('NIC', 'MON', 15, 175, 28, 'TER PACA', 'Regional'),
    R('AVG', 'MON', 0, 55, 12, 'TER Occitanie', 'Regional'),
    R('DIJ', 'BAS', 1, 180, 25, 'TER BFC', 'Regional'),
    R('STR', 'BAS', 2, 70, 12, 'TER GE', 'Regional'),
    R('TOU', 'BOR', 3, 130, 22, 'TER Occitanie', 'Regional'),

    // ══════════════════════════════════════════════════
    // REGIONALES ESPAÑA (Media Distancia / Cercanías)
    // ══════════════════════════════════════════════════
    R('MAD', 'VAD', 0, 65, 18, 'AVE', 'Regional'),
    R('MAD', 'SAL2', 1, 100, 22, 'Renfe MD', 'Regional'),
    R('VAD', 'LEO', 2, 110, 15, 'Renfe MD', 'Regional'),
    R('LEO', 'OVI', 3, 150, 18, 'Renfe Alvia', 'Regional'),
    R('OVI', 'GIJ', 4, 30, 5, 'Cercanías', 'Regional'),
    R('OVI', 'BIL', 5, 270, 25, 'FEVE', 'Regional'),
    R('VAL', 'CAS', 6, 45, 8, 'Renfe MD', 'Regional'),
    R('VAL', 'MUR', 7, 180, 15, 'Renfe MD', 'Regional'),
    R('MUR', 'ALI', 8, 60, 8, 'Cercanías', 'Regional'),
    R('MAD', 'COR', 9, 300, 40, 'Renfe Alvia', 'Regional'),
    R('COR', 'VIG', 10, 90, 10, 'Renfe MD', 'Regional'),
    R('ZAR', 'BCN', 11, 90, 22, 'AVE', 'Regional'),
    R('SEV', 'GRA', 12, 165, 22, 'Renfe MD', 'Regional'),
    R('GRA', 'MAL', 13, 105, 15, 'Renfe MD', 'Regional'),
    R('SAL2', 'VAD', 14, 70, 8, 'Renfe MD', 'Regional'),
    R('BIL', 'SAN', 0, 60, 8, 'Euskotren', 'Regional'),
    R('MAD', 'LEO', 1, 135, 22, 'Renfe Alvia', 'Regional'),

    // ══════════════════════════════════════════════════
    // REGIONALES ALEMANIA (RE/RB)
    // ══════════════════════════════════════════════════
    R('BER', 'ROS', 0, 140, 20, 'DB Regio', 'Regional'),
    R('ROS', 'HAM', 1, 150, 22, 'DB Regio', 'Regional'),
    R('HAM', 'KIE', 2, 75, 14, 'DB Regio', 'Regional'),
    R('HAN', 'KAS', 3, 90, 15, 'DB Regio', 'Regional'),
    R('KAS', 'FRA', 4, 120, 22, 'IC', 'Regional'),
    R('FRA', 'MNZ', 5, 25, 5, 'S-Bahn', 'Regional'),
    R('MNZ', 'COL', 6, 105, 18, 'RE Mittelrhein', 'Regional'),
    R('STU', 'FRB', 7, 130, 22, 'DB Regio', 'Regional'),
    R('FRB', 'BAS', 8, 45, 10, 'DB Regio', 'Regional'),
    R('MUC', 'AUG', 9, 35, 8, 'BRB', 'Regional'),
    R('AUG', 'STU', 10, 100, 18, 'DB Regio', 'Regional'),
    R('NUR', 'WRZ', 11, 60, 12, 'DB Regio', 'Regional'),
    R('WRZ', 'FRA', 12, 70, 14, 'DB Regio', 'Regional'),
    R('LEI', 'BER', 0, 75, 15, 'RE', 'Regional'),
    R('DRS', 'PRG', 1, 135, 18, 'EC', 'Regional'),
    R('BRE', 'HAM', 2, 60, 12, 'RE', 'Regional'),
    R('DOR', 'MAN', 3, 70, 15, 'RE', 'Regional'),
    R('KAS', 'HAN', 4, 90, 14, 'RE', 'Regional'),
    R('SZC', 'BER', 5, 160, 20, 'RE', 'Regional'),
    R('ROS', 'SZC', 6, 180, 15, 'RE', 'Regional'),
    R('HAM', 'SZC', 7, 240, 22, 'IC', 'Regional'),

    // ══════════════════════════════════════════════════
    // REGIONALES ITALIA (Regionale/RV)
    // ══════════════════════════════════════════════════
    R('FLO', 'PIS', 0, 50, 8, 'RV Toscana', 'Regional'),
    R('PIS', 'GEO', 1, 120, 15, 'RV Liguria', 'Regional'),
    R('FLO', 'PER2', 2, 130, 12, 'RV Umbria', 'Regional'),
    R('PER2', 'ROM', 3, 140, 15, 'RV', 'Regional'),
    R('ROM', 'ANO', 4, 210, 18, 'IC', 'Regional'),
    R('ANO', 'BOL', 5, 180, 15, 'IC', 'Regional'),
    R('NAP', 'SAL', 6, 40, 6, 'RV', 'Regional'),
    R('SAL', 'BAR2', 7, 240, 18, 'IC', 'Regional'),
    R('VEN', 'TRI', 8, 120, 12, 'RV FVG', 'Regional'),
    R('TRI', 'LJU', 9, 150, 15, 'SŽ', 'Regional'),
    R('MIL', 'BRE2', 10, 50, 8, 'Trenord', 'Regional'),
    R('BRE2', 'VER', 11, 40, 6, 'Trenord', 'Regional'),
    R('VER', 'BOL', 12, 70, 10, 'RV', 'Regional'),
    R('PAD', 'BOL', 13, 65, 8, 'RV', 'Regional'),
    R('TUR', 'MIL', 0, 55, 12, 'Frecciarossa', 'Regional'),
    R('GEO', 'MIL', 1, 90, 12, 'Trenord', 'Regional'),

    // ══════════════════════════════════════════════════
    // REGIONALES SUIZA
    // ══════════════════════════════════════════════════
    R('ZUR', 'BAS', 0, 55, 15, 'SBB IC', 'Regional'),
    R('BRN', 'LUC', 1, 60, 12, 'Zentralbahn', 'Regional'),
    R('LUC', 'INT', 2, 115, 15, 'Zentralbahn', 'Regional'),
    R('GEN', 'LAU', 3, 35, 8, 'SBB IR', 'Regional'),
    R('LAU', 'BRN', 4, 70, 12, 'SBB IC', 'Regional'),
    R('BAS', 'FRB', 5, 45, 10, 'SBB', 'Regional'),

    // ══════════════════════════════════════════════════
    // REGIONALES ESCANDINAVIA
    // ══════════════════════════════════════════════════
    R('STO', 'UPS', 0, 40, 10, 'SL/UL', 'Regional'),
    R('STO', 'NOR', 1, 80, 15, 'SJ Regional', 'Regional'),
    R('NOR', 'LIN', 2, 25, 6, 'SJ Regional', 'Regional'),
    R('LIN', 'GOT', 3, 120, 18, 'SJ Regional', 'Regional'),
    R('MAL2', 'COP', 0, 35, 10, 'Öresundståg', 'Regional'),
    R('COP', 'ODN', 1, 95, 18, 'DSB', 'Regional'),
    R('ODN', 'AAR', 2, 95, 15, 'DSB', 'Regional'),
    R('OSL', 'DRA', 3, 30, 8, 'VY', 'Regional'),
    R('DRA', 'STV', 4, 270, 30, 'VY Sørlandsbanen', 'Regional'),
    R('GOT', 'OSL', 5, 225, 30, 'VY', 'Regional'),

    // ══════════════════════════════════════════════════
    // REGIONALES POLONIA
    // ══════════════════════════════════════════════════
    R('WAR', 'LUB', 0, 140, 12, 'PKP IC', 'Regional'),
    R('WAR', 'BYD', 1, 180, 15, 'PKP IC', 'Regional'),
    R('BYD', 'GDA', 2, 120, 10, 'PKP IC', 'Regional'),
    R('POZ', 'SZC', 3, 150, 12, 'PKP IC', 'Regional'),
    R('WRO', 'KAT', 4, 180, 12, 'PKP IC', 'Regional'),
    R('KAT', 'KRK', 5, 70, 6, 'Koleje Śląskie', 'Regional'),
    R('LOD', 'WAR', 6, 75, 8, 'PKP IC', 'Regional'),
    R('GDA', 'SZC', 7, 360, 20, 'PKP IC', 'Regional'),
    R('POZ', 'WAR', 8, 180, 18, 'PKP IC', 'Regional'),

    // ══════════════════════════════════════════════════
    // REGIONALES RUMANÍA
    // ══════════════════════════════════════════════════
    R('BUC', 'IAS', 0, 360, 20, 'CFR IR', 'Regional'),
    R('BRV', 'SIB', 1, 150, 10, 'CFR R', 'Regional'),
    R('SIB', 'CLJ', 2, 210, 12, 'CFR R', 'Regional'),
    R('CLJ', 'IAS', 3, 420, 18, 'CFR IR', 'Regional'),
    R('TIM', 'CLJ', 4, 300, 15, 'CFR IR', 'Regional'),
    R('BUC', 'BRV', 5, 170, 12, 'CFR IR', 'Regional'),

    // ══════════════════════════════════════════════════
    // REGIONALES HUNGRÍA
    // ══════════════════════════════════════════════════
    R('BUD', 'SZE', 0, 150, 12, 'MÁV', 'Regional'),
    R('BUD', 'GYR', 1, 75, 10, 'MÁV', 'Regional'),
    R('BUD', 'PCS', 2, 180, 12, 'MÁV', 'Regional'),
    R('GYR', 'VIE', 3, 95, 15, 'MÁV-ÖBB', 'Regional'),
    R('SZE', 'BEL', 4, 300, 15, 'MÁV-SŽ', 'Regional'),
    R('PCS', 'ZAG', 5, 300, 15, 'MÁV-HŽ', 'Regional'),
    R('DEB', 'BUD', 6, 155, 12, 'MÁV IC', 'Regional'),

    // ══════════════════════════════════════════════════
    // REGIONALES AUSTRIA
    // ══════════════════════════════════════════════════
    R('VIE', 'LNZ', 0, 80, 18, 'ÖBB REX', 'Regional'),
    R('LNZ', 'SBG', 1, 70, 14, 'ÖBB REX', 'Regional'),
    R('GRZ', 'VIE', 2, 155, 22, 'ÖBB REX', 'Regional'),
    R('INS', 'SBG', 3, 110, 18, 'ÖBB REX', 'Regional'),
    R('INS', 'MUC', 4, 105, 22, 'DB-ÖBB', 'Regional'),
    R('GRZ', 'MRB', 5, 60, 8, 'S-Bahn Stmk', 'Regional'),

    // ══════════════════════════════════════════════════
    // REGIONALES CHEQUIA
    // ══════════════════════════════════════════════════
    R('PRG', 'BRO', 0, 150, 12, 'RegioJet', 'Regional'),
    R('BRO', 'OST', 1, 120, 10, 'ČD', 'Regional'),
    R('PRG', 'DRS', 2, 135, 15, 'ČD', 'Regional'),

    // ══════════════════════════════════════════════════
    // REGIONALES PORTUGAL
    // ══════════════════════════════════════════════════
    R('LIS', 'COI', 0, 115, 12, 'CP IC', 'Regional'),
    R('COI', 'OPO', 1, 65, 8, 'CP IR', 'Regional'),
    R('LIS', 'FAR', 2, 180, 20, 'CP IR', 'Regional'),
    R('OPO', 'VIG', 3, 120, 12, 'Celta', 'Regional'),

    // ══════════════════════════════════════════════════
    // REGIONALES BALCANES
    // ══════════════════════════════════════════════════
    R('ZAG', 'LJU', 0, 140, 12, 'SŽ-HŽ', 'Regional'),
    R('ZAG', 'RIJ', 1, 250, 15, 'HŽ', 'Regional'),
    R('SPL', 'ZAG', 2, 340, 22, 'HŽ', 'Regional'),
    R('BEL', 'NOV', 3, 80, 6, 'SŽ', 'Regional'),
    R('BEL', 'NIS', 4, 180, 10, 'SŽ', 'Regional'),
    R('NIS', 'SKP', 5, 240, 12, 'SŽ-MŽ', 'Regional'),
    R('SOF', 'PLV', 6, 150, 8, 'BDŽ', 'Regional'),
    R('PLV', 'VAR', 7, 300, 12, 'BDŽ', 'Regional'),
    R('ATH', 'PAT', 8, 210, 12, 'Hellenic Train', 'Regional'),
    R('SAR', 'ZAG', 9, 540, 18, 'ŽFBH-HŽ', 'Regional'),
    R('SAR', 'BEL', 10, 480, 15, 'ŽFBH-SŽ', 'Regional'),

    // ══════════════════════════════════════════════════
    // REGIONALES BÁLTICOS
    // ══════════════════════════════════════════════════
    R('VIL', 'KAU', 0, 75, 5, 'LTG', 'Regional'),
    R('TAL', 'TAR', 1, 140, 8, 'Elron', 'Regional'),
    R('RIG', 'VIL', 2, 265, 15, 'Rail Baltica', 'Regional'),

    // ══════════════════════════════════════════════════
    // CONEXIONES TRANSFRONTERIZAS EXTRA
    // ══════════════════════════════════════════════════
    R('FRB', 'BAS', 0, 45, 8, 'DB-SBB', 'Regional'),
    R('STR', 'ZUR', 1, 150, 22, 'EC', 'Regional'),
    R('BAS', 'MIL', 2, 260, 30, 'EC', 'Intercity'),
    R('NIC', 'GEO', 3, 180, 20, 'Thello', 'Regional'),
    R('PER', 'BCN', 4, 95, 18, 'Renfe-SNCF', 'Regional'),
    R('BAY', 'BIL', 5, 180, 18, 'Euskotren', 'Regional'),
    R('KAT', 'OST', 6, 100, 8, 'PKP', 'Regional'),
    R('OST', 'BRO', 7, 180, 12, 'ČD', 'Regional'),
    R('TRI', 'VEN', 8, 120, 10, 'RV FVG', 'Regional'),
    R('MRB', 'GRZ', 9, 100, 8, 'SŽ-ÖBB', 'Regional'),
    R('SZC', 'BER', 10, 160, 15, 'DB', 'Regional'),
    R('DEB', 'KOS', 11, 240, 12, 'MÁV-ZSSK', 'Regional'),
    R('KOS', 'KRK', 12, 420, 18, 'ZSSK-PKP', 'Regional'),
];
