/**
 * lib/drug-info.ts — Información farmacéutica profesional por principio activo.
 *
 * Base de conocimientos curada para mostrar información tipo prospecto en
 * páginas de producto. Lookup por `active_ingredient` normalizado.
 *
 * Fuente: Formulario Nacional de Medicamentos (ISP Chile), Vademécum Chileno,
 * Beers Criteria (cautelas adulto mayor), prospectos oficiales.
 *
 * NO sustituye al criterio médico. La UI muestra disclaimer obligatorio.
 */

export interface DrugInfo {
  /** Composición/categoría farmacológica breve */
  categoria: string;
  /** Indicaciones terapéuticas principales */
  indicaciones: string;
  /** Posología orientativa (dosis adulto). Siempre seguir indicación médica. */
  posologia: string;
  /** Efectos adversos más frecuentes y graves a vigilar */
  efectos_adversos: string;
  /** Contraindicaciones absolutas y relativas */
  contraindicaciones: string;
  /** Precauciones específicas para adulto mayor (≥65 años) */
  precauciones_adulto_mayor: string;
  /** Interacciones medicamentosas relevantes */
  interacciones: string;
  /** Conservación */
  conservacion?: string;
}

/**
 * KB de principios activos. Clave: nombre canónico en MAYÚSCULAS sin tildes ni dosis.
 * Cubre los principios activos más comunes en farmacia ambulatoria chilena.
 */
export const DRUG_INFO: Record<string, DrugInfo> = {
  PARACETAMOL: {
    categoria: 'Analgésico y antipirético no opioide.',
    indicaciones: 'Dolor leve a moderado (cefalea, dolor dental, musculoesquelético, dismenorrea) y fiebre.',
    posologia: 'Adultos: 500–1000 mg cada 6–8 horas. Máximo 4 g al día. En adultos mayores o bajo peso, no superar 3 g/día.',
    efectos_adversos: 'Bien tolerado a dosis terapéuticas. A dosis altas o prolongadas: daño hepático (riesgo aumentado con alcohol o ayuno). Rash cutáneo raro.',
    contraindicaciones: 'Hipersensibilidad al paracetamol. Insuficiencia hepática severa.',
    precauciones_adulto_mayor: 'Es el analgésico de primera elección en adulto mayor por buen perfil de seguridad. Reducir dosis máxima a 3 g/día si hay bajo peso, desnutrición o consumo regular de alcohol. Vigilar uso simultáneo de productos para resfrío que también contengan paracetamol.',
    interacciones: 'Warfarina (puede aumentar INR con uso prolongado). Alcohol (mayor riesgo hepatotóxico). Inductores hepáticos (rifampicina, fenitoína, carbamazepina).',
    conservacion: 'Temperatura ambiente, bajo 30 °C, protegido de la humedad.',
  },

  IBUPROFENO: {
    categoria: 'Antiinflamatorio no esteroidal (AINE), derivado del ácido propiónico.',
    indicaciones: 'Dolor leve a moderado, fiebre, inflamación (artritis, esguinces, dismenorrea, cefalea).',
    posologia: 'Adultos: 200–400 mg cada 6–8 horas. Máximo 1200 mg/día sin receta, hasta 2400 mg/día con indicación médica. Tomar con alimentos.',
    efectos_adversos: 'Molestias gástricas, acidez, náuseas. Riesgo de úlcera y sangrado digestivo. Retención de líquidos, alza de presión arterial. Daño renal con uso prolongado o deshidratación.',
    contraindicaciones: 'Úlcera péptica activa, sangrado gastrointestinal previo, insuficiencia cardíaca grave, insuficiencia renal o hepática severa, embarazo (3er trimestre), alergia a AINES.',
    precauciones_adulto_mayor: 'EVITAR uso crónico en mayores de 65 años (criterios Beers): alto riesgo de úlcera, sangrado digestivo, falla renal y descompensación de hipertensión o insuficiencia cardíaca. Si es necesario, usar dosis mínima por el menor tiempo posible y considerar protector gástrico (omeprazol). Preferir paracetamol como primera opción.',
    interacciones: 'Anticoagulantes (warfarina, rivaroxabán) y antiplaquetarios (aspirina, clopidogrel): mayor riesgo de sangrado. IECA/ARA II y diuréticos: reducen efecto antihipertensivo y aumentan riesgo renal. Litio, metotrexato: aumentan toxicidad. Corticoides: mayor riesgo gástrico.',
    conservacion: 'Temperatura ambiente, bajo 30 °C.',
  },

  DICLOFENACO: {
    categoria: 'Antiinflamatorio no esteroidal (AINE).',
    indicaciones: 'Dolor e inflamación en artrosis, artritis, dolor postoperatorio, lumbago, cólicos, dismenorrea.',
    posologia: 'Adultos: 50 mg 2–3 veces al día, o 75 mg cada 12 h. Máximo 150 mg/día. Tomar con alimentos.',
    efectos_adversos: 'Gastritis, úlcera, sangrado digestivo. Aumento de presión arterial, retención de líquidos. Mayor riesgo cardiovascular (infarto, ACV) que otros AINEs. Daño renal y hepático.',
    contraindicaciones: 'Úlcera activa, sangrado digestivo, insuficiencia cardíaca, cardiopatía isquémica, ACV previo, insuficiencia renal o hepática severa, embarazo (3er trimestre).',
    precauciones_adulto_mayor: 'EVITAR en adulto mayor por alto riesgo cardiovascular, gástrico y renal (criterios Beers). Si es indispensable, dosis mínima y duración corta, con protector gástrico. La presentación tópica (gel) es preferible para dolor localizado.',
    interacciones: 'Igual que ibuprofeno: anticoagulantes, IECA/ARA II, diuréticos, litio, metotrexato, corticoides.',
    conservacion: 'Temperatura ambiente, protegido de la luz.',
  },

  KETOPROFENO: {
    categoria: 'Antiinflamatorio no esteroidal (AINE).',
    indicaciones: 'Dolor e inflamación musculoesquelética, artrosis, artritis reumatoide, dismenorrea.',
    posologia: 'Adultos: 50 mg cada 6–8 h o 100 mg cada 12 h. Máximo 200 mg/día. Tomar con alimentos.',
    efectos_adversos: 'Gastritis, úlcera, sangrado digestivo. Cefalea, mareos. Fotosensibilidad cutánea (la presentación en gel puede causar reacciones con exposición solar).',
    contraindicaciones: 'Úlcera activa, alergia a AINES, insuficiencia renal o hepática severa, embarazo (3er trimestre).',
    precauciones_adulto_mayor: 'Mismas cautelas que otros AINEs en adulto mayor: evitar uso crónico, considerar paracetamol o gel tópico. Vigilar función renal.',
    interacciones: 'Anticoagulantes, IECA/ARA II, diuréticos, litio, metotrexato.',
    conservacion: 'Temperatura ambiente.',
  },

  KETOROLACO: {
    categoria: 'Antiinflamatorio no esteroidal (AINE) potente.',
    indicaciones: 'Dolor moderado a severo de corta duración (postoperatorio, cólico renal). Uso máximo 5 días.',
    posologia: 'Adultos: 10 mg cada 4–6 horas. Máximo 40 mg/día. No exceder 5 días de tratamiento.',
    efectos_adversos: 'Alto riesgo de sangrado digestivo y falla renal aguda. Náuseas, mareo, somnolencia.',
    contraindicaciones: 'Insuficiencia renal, deshidratación, úlcera, riesgo de sangrado, embarazo, lactancia.',
    precauciones_adulto_mayor: 'EVITAR en adulto mayor por alto riesgo renal y digestivo. Si se usa, reducir dosis a la mitad y limitar a 2–3 días. No combinar con otros AINEs.',
    interacciones: 'Anticoagulantes (riesgo de sangrado severo), IECA, diuréticos, litio, metotrexato.',
    conservacion: 'Temperatura ambiente.',
  },

  METAMIZOL: {
    categoria: 'Analgésico no opioide, antipirético, espasmolítico (dipirona).',
    indicaciones: 'Dolor moderado a severo, especialmente cólicos viscerales (renal, biliar). Fiebre refractaria.',
    posologia: 'Adultos: 500–1000 mg cada 6–8 horas vía oral. Máximo 4 g/día.',
    efectos_adversos: 'Hipotensión (especialmente vía endovenosa). Reacciones alérgicas. Raramente, pero grave: agranulocitosis (caída de glóbulos blancos) — consulte si aparece fiebre, dolor de garganta o úlceras en boca.',
    contraindicaciones: 'Alergia a pirazolonas, déficit de G6PD, embarazo (1er y 3er trimestre), antecedente de agranulocitosis.',
    precauciones_adulto_mayor: 'Útil cuando paracetamol es insuficiente y los AINEs están contraindicados. Vigilar presión arterial. Suspender ante cualquier signo de infección (fiebre, malestar).',
    interacciones: 'Anticoagulantes (potencia efecto), clorpromazina (hipotermia severa), ciclosporina (reduce niveles).',
    conservacion: 'Temperatura ambiente.',
  },

  'ACIDO ACETILSALICILICO': {
    categoria: 'AINE y antiagregante plaquetario (aspirina).',
    indicaciones: 'Dosis bajas (75–100 mg/día): prevención cardiovascular (post-infarto, post-ACV). Dosis altas: dolor, fiebre, inflamación.',
    posologia: 'Cardioprotección: 75–100 mg/día. Analgesia: 500–1000 mg cada 4–6 h (máx 4 g/día). Tomar con alimentos.',
    efectos_adversos: 'Gastritis, úlcera, sangrado digestivo (incluso con dosis bajas). Tinnitus a dosis altas. Reacciones alérgicas. Síndrome de Reye en niños (no usar bajo 16 años).',
    contraindicaciones: 'Úlcera activa, hemofilia, alergia a salicilatos, embarazo (3er trimestre), niños con cuadros virales.',
    precauciones_adulto_mayor: 'A dosis cardiovasculares (100 mg) el balance riesgo/beneficio se evalúa individualmente: mayor riesgo de sangrado digestivo y cerebral con la edad. Considerar protector gástrico. Suspender 7 días antes de cirugía electiva si lo indica el médico.',
    interacciones: 'Anticoagulantes (riesgo de sangrado grave). Otros AINEs. Metotrexato. IECA/ARA II y diuréticos (reducen efecto).',
    conservacion: 'Temperatura ambiente, en envase original cerrado (sensible a humedad).',
  },

  NAPROXENO: {
    categoria: 'AINE de vida media larga.',
    indicaciones: 'Dolor e inflamación crónica (artrosis, artritis), dismenorrea, dolor agudo musculoesquelético.',
    posologia: 'Adultos: 250–500 mg cada 12 h. Máximo 1000 mg/día. Con alimentos.',
    efectos_adversos: 'Gastritis, úlcera, sangrado digestivo. Mareos, retención de líquidos. Tiene mejor perfil cardiovascular que otros AINEs.',
    contraindicaciones: 'Úlcera activa, insuficiencia renal o hepática severa, alergia a AINEs.',
    precauciones_adulto_mayor: 'Si se requiere un AINE oral crónico en adulto mayor, es preferible a diclofenaco o ibuprofeno por menor riesgo cardiovascular. Aún así, usar dosis mínima eficaz y considerar protector gástrico.',
    interacciones: 'Anticoagulantes, IECA, diuréticos, litio, metotrexato.',
    conservacion: 'Temperatura ambiente.',
  },

  MELOXICAM: {
    categoria: 'AINE preferencial COX-2.',
    indicaciones: 'Artrosis, artritis reumatoide, espondilitis anquilosante.',
    posologia: 'Adultos: 7,5–15 mg una vez al día. Tomar con alimentos.',
    efectos_adversos: 'Menos gastrolesivo que AINEs clásicos, pero igual riesgo cardiovascular y renal. Cefalea, edema.',
    contraindicaciones: 'Úlcera activa, insuficiencia cardíaca grave, alergia a AINEs.',
    precauciones_adulto_mayor: 'Iniciar con 7,5 mg/día. Vigilar función renal y presión arterial.',
    interacciones: 'Anticoagulantes, IECA, diuréticos, litio.',
    conservacion: 'Temperatura ambiente.',
  },

  ETORICOXIB: {
    categoria: 'AINE inhibidor selectivo COX-2.',
    indicaciones: 'Artrosis, artritis reumatoide, gota aguda, dolor postoperatorio.',
    posologia: 'Adultos: 60–90 mg una vez al día (artrosis/artritis); 120 mg/día por máximo 8 días (gota aguda).',
    efectos_adversos: 'Hipertensión, edema. Menor riesgo gástrico que AINEs clásicos. Riesgo cardiovascular aumentado (infarto, ACV).',
    contraindicaciones: 'Hipertensión no controlada, insuficiencia cardíaca, cardiopatía isquémica, ACV previo, insuficiencia renal o hepática severa.',
    precauciones_adulto_mayor: 'Vigilar estrechamente la presión arterial. Evitar si hay enfermedad cardiovascular establecida.',
    interacciones: 'IECA/ARA II, diuréticos, anticoagulantes, litio.',
    conservacion: 'Temperatura ambiente.',
  },

  CELECOXIB: {
    categoria: 'AINE inhibidor selectivo COX-2.',
    indicaciones: 'Artrosis, artritis reumatoide, dolor agudo.',
    posologia: 'Adultos: 100–200 mg cada 12 h. Máximo 400 mg/día.',
    efectos_adversos: 'Menor riesgo gástrico, pero mantiene riesgo cardiovascular y renal. Edema, hipertensión.',
    contraindicaciones: 'Cardiopatía isquémica, ACV, alergia a sulfas, insuficiencia cardíaca grave.',
    precauciones_adulto_mayor: 'Buena alternativa cuando se requiere AINE crónico y hay riesgo gástrico, pero precaución cardiovascular.',
    interacciones: 'Warfarina (aumenta INR), IECA, diuréticos.',
    conservacion: 'Temperatura ambiente.',
  },

  AMOXICILINA: {
    categoria: 'Antibiótico betalactámico (penicilina de amplio espectro).',
    indicaciones: 'Infecciones respiratorias (otitis, sinusitis, neumonía), urinarias, dentales, cutáneas. Erradicación de H. pylori (en combinación).',
    posologia: 'Adultos: 500 mg cada 8 h o 875 mg cada 12 h, por 7–10 días. Cumplir tratamiento completo aunque mejoren los síntomas.',
    efectos_adversos: 'Diarrea, náuseas, rash cutáneo. Candidiasis. Raramente: colitis pseudomembranosa, anafilaxia.',
    contraindicaciones: 'Alergia a penicilinas o cefalosporinas. Mononucleosis (rash frecuente).',
    precauciones_adulto_mayor: 'Ajustar dosis si hay insuficiencia renal (frecuente en adulto mayor). Vigilar hidratación si hay diarrea.',
    interacciones: 'Anticonceptivos orales (puede reducir eficacia — usar método de respaldo). Alopurinol (aumenta rash). Metotrexato (aumenta toxicidad).',
    conservacion: 'Cápsulas: temperatura ambiente. Suspensión reconstituida: refrigerar y desechar a los 7–14 días.',
  },

  'AMOXICILINA + ACIDO CLAVULANICO': {
    categoria: 'Antibiótico betalactámico combinado con inhibidor de betalactamasas.',
    indicaciones: 'Infecciones por bacterias resistentes a amoxicilina sola: sinusitis recurrente, otitis, infecciones dentales, mordeduras, infecciones urinarias complicadas.',
    posologia: 'Adultos: 500/125 mg cada 8 h o 875/125 mg cada 12 h. Tomar al inicio de las comidas para reducir molestias gástricas.',
    efectos_adversos: 'Diarrea (más frecuente que amoxicilina sola), náuseas, candidiasis. Riesgo de hepatitis colestásica (poco frecuente).',
    contraindicaciones: 'Alergia a penicilinas. Antecedente de hepatitis por amoxiclav.',
    precauciones_adulto_mayor: 'Mayor riesgo de diarrea y hepatitis colestásica. Ajustar dosis en insuficiencia renal.',
    interacciones: 'Anticoagulantes (puede potenciar warfarina), anticonceptivos orales, alopurinol.',
    conservacion: 'Suspensión: refrigerar, usar dentro de 7 días.',
  },

  AZITROMICINA: {
    categoria: 'Antibiótico macrólido de vida media larga.',
    indicaciones: 'Infecciones respiratorias (faringitis, bronquitis, neumonía atípica), de piel, urogenitales (clamidia).',
    posologia: 'Adultos: 500 mg el día 1, luego 250 mg/día por 4 días (total 5 días). Tomar con o sin alimentos.',
    efectos_adversos: 'Diarrea, náuseas, dolor abdominal. Prolongación del intervalo QT (riesgo de arritmias).',
    contraindicaciones: 'Alergia a macrólidos, historia de prolongación QT, insuficiencia hepática severa.',
    precauciones_adulto_mayor: 'Riesgo elevado de arritmias por QT prolongado, especialmente si toma otros fármacos que prolongan QT, tiene cardiopatía o desequilibrio electrolítico. Solicitar ECG si hay dudas.',
    interacciones: 'Antiarrítmicos, antipsicóticos (haloperidol, risperidona), antidepresivos (citalopram, escitalopram), warfarina, digoxina.',
    conservacion: 'Temperatura ambiente.',
  },

  CIPROFLOXACINO: {
    categoria: 'Antibiótico fluoroquinolona de amplio espectro.',
    indicaciones: 'Infecciones urinarias complicadas, prostatitis, infecciones gastrointestinales bacterianas, respiratorias seleccionadas.',
    posologia: 'Adultos: 250–750 mg cada 12 h, según indicación. Tomar con abundante agua, separado de antiácidos y lácteos al menos 2 horas.',
    efectos_adversos: 'Tendinitis y ruptura tendinosa (especialmente tendón de Aquiles), neuropatía periférica, alteraciones psiquiátricas, prolongación QT, diarrea por C. difficile, fotosensibilidad. Hipoglucemia o hiperglucemia.',
    contraindicaciones: 'Antecedente de tendinitis por quinolonas, embarazo, lactancia, menores de 18 años.',
    precauciones_adulto_mayor: 'ALTO RIESGO en adulto mayor: tendinopatía (más aún si toma corticoides), confusión, arritmias, hipoglucemia (si toma antidiabéticos). Reservar para infecciones donde no hay alternativa. Suspender ante cualquier dolor tendinoso.',
    interacciones: 'Antiácidos, hierro, calcio, lácteos (reducen absorción). Warfarina (aumenta INR). Teofilina, tizanidina (toxicidad). Antidiabéticos (hipo/hiperglucemia). Corticoides (riesgo tendinoso).',
    conservacion: 'Temperatura ambiente.',
  },

  METRONIDAZOL: {
    categoria: 'Antibiótico/antiprotozoario nitroimidazol.',
    indicaciones: 'Infecciones por anaerobios, vaginosis bacteriana, tricomoniasis, amebiasis, giardiasis, H. pylori, colitis por C. difficile.',
    posologia: 'Adultos: 500 mg cada 8 h por 7–10 días, o según indicación. Tomar con alimentos.',
    efectos_adversos: 'Sabor metálico, náuseas, cefalea. Orina oscura (inocua). Neuropatía con uso prolongado.',
    contraindicaciones: '1er trimestre embarazo, alergia. Consumo de alcohol (reacción tipo disulfiram).',
    precauciones_adulto_mayor: 'NO consumir alcohol durante el tratamiento y hasta 48 h después. Vigilar neuropatía si el tratamiento se prolonga.',
    interacciones: 'Alcohol (efecto disulfiram: náuseas, taquicardia, hipotensión). Warfarina (aumenta INR). Litio (toxicidad).',
    conservacion: 'Temperatura ambiente.',
  },

  CLOTRIMAZOL: {
    categoria: 'Antifúngico imidazólico tópico.',
    indicaciones: 'Candidiasis cutánea, vulvovaginal, oral. Tiña corporis, pedis, cruris. Pitiriasis versicolor.',
    posologia: 'Crema/loción: aplicar 2–3 veces al día por 2–4 semanas. Óvulos vaginales: según presentación, generalmente 1 al día por 6 días.',
    efectos_adversos: 'Irritación local, ardor, enrojecimiento. Raramente reacciones alérgicas.',
    contraindicaciones: 'Hipersensibilidad al clotrimazol.',
    precauciones_adulto_mayor: 'Seguro tópicamente. En micosis recurrente vaginal o cutánea, descartar diabetes mal controlada.',
    interacciones: 'No relevantes por vía tópica.',
    conservacion: 'Temperatura ambiente.',
  },

  KETOCONAZOL: {
    categoria: 'Antifúngico imidazólico.',
    indicaciones: 'Tópico: dermatitis seborreica, caspa, pitiriasis versicolor, micosis cutáneas. Shampoo: caspa fúngica.',
    posologia: 'Shampoo: 2 veces por semana, dejar 3–5 min antes de enjuagar, por 2–4 semanas. Crema: 1–2 veces al día.',
    efectos_adversos: 'Irritación local, prurito, cambios en textura del cabello (shampoo).',
    contraindicaciones: 'Hipersensibilidad. Vía oral está restringida por hepatotoxicidad.',
    precauciones_adulto_mayor: 'La presentación oral está prácticamente en desuso por riesgo hepático. Tópico es seguro.',
    interacciones: 'No relevantes por vía tópica.',
    conservacion: 'Temperatura ambiente.',
  },

  TERBINAFINA: {
    categoria: 'Antifúngico alilamina.',
    indicaciones: 'Onicomicosis (hongos en uñas), tiña del cuero cabelludo, tiña corporal extensa. Tópico para micosis cutáneas.',
    posologia: 'Oral: 250 mg/día por 6 semanas (uñas manos) a 12 semanas (uñas pies). Tópico: 1–2 veces al día por 1–2 semanas.',
    efectos_adversos: 'Oral: alteración del gusto (puede durar semanas), molestias gástricas, rash, hepatotoxicidad (poco frecuente pero seria). Tópico: irritación local.',
    contraindicaciones: 'Insuficiencia hepática, insuficiencia renal severa.',
    precauciones_adulto_mayor: 'Solicitar pruebas hepáticas antes y durante el tratamiento oral. Suspender ante ictericia, orina oscura o dolor abdominal.',
    interacciones: 'Inhibe CYP2D6: precaución con betabloqueantes, antidepresivos tricíclicos, ISRS.',
    conservacion: 'Temperatura ambiente.',
  },

  FLUCONAZOL: {
    categoria: 'Antifúngico triazol.',
    indicaciones: 'Candidiasis vulvovaginal, oral, esofágica, sistémica. Onicomicosis. Profilaxis en inmunodeprimidos.',
    posologia: 'Candidiasis vaginal: dosis única de 150 mg. Otras indicaciones: 100–400 mg/día.',
    efectos_adversos: 'Cefalea, náuseas, dolor abdominal. Hepatotoxicidad. Prolongación QT.',
    contraindicaciones: 'Embarazo (en lo posible), uso simultáneo con fármacos que prolonguen QT.',
    precauciones_adulto_mayor: 'Vigilar interacciones (afecta muchos CYP). Ajustar dosis en insuficiencia renal.',
    interacciones: 'Warfarina, fenitoína, sulfonilureas, estatinas (riesgo de miopatía), benzodiazepinas, amiodarona.',
    conservacion: 'Temperatura ambiente.',
  },

  ACICLOVIR: {
    categoria: 'Antiviral análogo de nucleósido.',
    indicaciones: 'Herpes simple (oral, genital), herpes zóster (culebrilla), varicela.',
    posologia: 'Herpes labial: 400 mg 5 veces al día por 5 días, o crema 5 veces al día. Herpes zóster: 800 mg 5 veces al día por 7 días.',
    efectos_adversos: 'Náuseas, cefalea, mareo. Daño renal (especialmente si hay deshidratación o dosis altas). Confusión en adulto mayor.',
    contraindicaciones: 'Hipersensibilidad.',
    precauciones_adulto_mayor: 'Mantener buena hidratación. Ajustar dosis en insuficiencia renal. Riesgo de confusión y alucinaciones, especialmente con función renal disminuida.',
    interacciones: 'Probenecid (aumenta niveles), otros nefrotóxicos.',
    conservacion: 'Temperatura ambiente.',
  },

  LOSARTAN: {
    categoria: 'Antihipertensivo. Antagonista del receptor de angiotensina II (ARA II).',
    indicaciones: 'Hipertensión arterial, nefropatía diabética, insuficiencia cardíaca.',
    posologia: 'Adultos: inicio 50 mg/día, mantener 50–100 mg/día. Una sola toma diaria.',
    efectos_adversos: 'Mareos, hipotensión (especialmente al inicio o con diuréticos). Hiperkalemia. Tos seca menos frecuente que con IECA. Insuficiencia renal en deshidratados.',
    contraindicaciones: 'Embarazo, estenosis bilateral de arterias renales, hiperkalemia.',
    precauciones_adulto_mayor: 'Iniciar con 25 mg/día y titular. Vigilar presión arterial sentado y de pie (riesgo de hipotensión ortostática y caídas). Controlar potasio y creatinina a las 2 semanas y luego periódicamente.',
    interacciones: 'AINEs (reducen efecto, aumentan riesgo renal). Diuréticos ahorradores de potasio, suplementos de potasio (hiperkalemia). Litio (toxicidad).',
    conservacion: 'Temperatura ambiente.',
  },

  ENALAPRIL: {
    categoria: 'Antihipertensivo. Inhibidor de la enzima convertidora de angiotensina (IECA).',
    indicaciones: 'Hipertensión, insuficiencia cardíaca, nefropatía diabética, post-infarto.',
    posologia: 'Adultos: inicio 5–10 mg/día, mantener 10–40 mg/día (1–2 tomas).',
    efectos_adversos: 'Tos seca persistente (10–15%), hipotensión, mareo, hiperkalemia, falla renal, angioedema (raro pero grave).',
    contraindicaciones: 'Embarazo, antecedente de angioedema, estenosis renal bilateral.',
    precauciones_adulto_mayor: 'Iniciar con dosis baja (2,5–5 mg). Vigilar caídas por hipotensión ortostática. Controlar creatinina y potasio. Suspender ante tos persistente o hinchazón facial/lingual.',
    interacciones: 'AINEs, diuréticos ahorradores de potasio, litio, alopurinol.',
    conservacion: 'Temperatura ambiente.',
  },

  ATENOLOL: {
    categoria: 'Betabloqueante cardioselectivo (β1).',
    indicaciones: 'Hipertensión, angina, post-infarto, arritmias supraventriculares.',
    posologia: 'Adultos: 25–100 mg/día en una toma.',
    efectos_adversos: 'Bradicardia, fatiga, frialdad de extremidades, broncoespasmo, disfunción eréctil, depresión, enmascaramiento de hipoglucemia en diabéticos.',
    contraindicaciones: 'Bradicardia severa, bloqueo AV 2°–3° grado, asma, insuficiencia cardíaca descompensada, hipotensión.',
    precauciones_adulto_mayor: 'No se considera primera línea como antihipertensivo en mayores. Si se usa, iniciar 25 mg/día. NO suspender bruscamente (riesgo de angina/infarto de rebote): reducir gradualmente. Vigilar frecuencia cardíaca (no bajar de 50 lpm).',
    interacciones: 'Verapamilo, diltiazem (bradicardia severa). Antidiabéticos (enmascara hipoglucemia). Clonidina (no suspender ambos a la vez).',
    conservacion: 'Temperatura ambiente.',
  },

  CARVEDILOL: {
    categoria: 'Betabloqueante no selectivo con efecto alfa-bloqueante.',
    indicaciones: 'Insuficiencia cardíaca crónica, hipertensión, post-infarto.',
    posologia: 'Adultos: inicio 3,125 mg cada 12 h, titulación gradual hasta 25 mg cada 12 h. Tomar con alimentos.',
    efectos_adversos: 'Mareo, hipotensión ortostática (sobre todo al inicio o al subir dosis), bradicardia, fatiga, edema.',
    contraindicaciones: 'Asma, bloqueo AV avanzado, insuficiencia cardíaca descompensada aguda, hipotensión severa.',
    precauciones_adulto_mayor: 'Titular muy lentamente. Alto riesgo de caídas por hipotensión. Tomar con alimentos reduce hipotensión. No suspender bruscamente.',
    interacciones: 'Verapamilo, diltiazem, antidiabéticos, digoxina, amiodarona.',
    conservacion: 'Temperatura ambiente.',
  },

  AMLODIPINO: {
    categoria: 'Antihipertensivo. Antagonista de canales de calcio (dihidropiridina).',
    indicaciones: 'Hipertensión arterial, angina estable y vasoespástica.',
    posologia: 'Adultos: inicio 2,5–5 mg/día, mantener 5–10 mg/día. Una toma diaria.',
    efectos_adversos: 'Edema de tobillos (frecuente, dosis-dependiente), rubor, cefalea, palpitaciones, hiperplasia gingival.',
    contraindicaciones: 'Hipotensión severa, shock cardiogénico, estenosis aórtica severa.',
    precauciones_adulto_mayor: 'Buen perfil en adulto mayor. Iniciar con 2,5 mg. Vigilar edema de extremidades inferiores (no responde a diuréticos: se maneja reduciendo dosis o cambiando fármaco).',
    interacciones: 'Simvastatina (limitar a 20 mg). Inhibidores CYP3A4 (claritromicina, antifúngicos azoles): aumentan niveles.',
    conservacion: 'Temperatura ambiente.',
  },

  HIDROCLOROTIAZIDA: {
    categoria: 'Diurético tiazídico.',
    indicaciones: 'Hipertensión arterial, edema leve, prevención de cálculos renales por hipercalciuria.',
    posologia: 'Adultos: 12,5–25 mg/día en la mañana.',
    efectos_adversos: 'Hipokalemia, hiponatremia, hiperuricemia (gota), hiperglucemia, hipotensión ortostática, fotosensibilidad, disfunción eréctil.',
    contraindicaciones: 'Anuria, alergia a sulfas, hiponatremia o hipokalemia severas.',
    precauciones_adulto_mayor: 'Frecuente hiponatremia en mayores: vigilar sodio sérico, especialmente en las primeras semanas. Riesgo de caídas por hipotensión. Tomar en la mañana para evitar nicturia.',
    interacciones: 'Litio (toxicidad), AINEs (reducen efecto), digoxina (toxicidad por hipokalemia).',
    conservacion: 'Temperatura ambiente.',
  },

  BISOPROLOL: {
    categoria: 'Betabloqueante cardioselectivo (β1).',
    indicaciones: 'Hipertensión, angina, insuficiencia cardíaca crónica.',
    posologia: 'Adultos: 2,5–10 mg/día en una toma matinal.',
    efectos_adversos: 'Bradicardia, fatiga, mareo, frialdad de extremidades, broncoespasmo (menor que no selectivos).',
    contraindicaciones: 'Bradicardia severa, bloqueo AV 2°–3°, asma severa, insuficiencia cardíaca aguda.',
    precauciones_adulto_mayor: 'Buen perfil. Iniciar con 1,25–2,5 mg. No suspender bruscamente.',
    interacciones: 'Verapamilo, diltiazem, clonidina, antidiabéticos.',
    conservacion: 'Temperatura ambiente.',
  },

  PROPRANOLOL: {
    categoria: 'Betabloqueante no selectivo.',
    indicaciones: 'Hipertensión, angina, profilaxis de migraña, temblor esencial, ansiedad por escenario, hipertiroidismo (sintomático).',
    posologia: 'Adultos: 40–160 mg/día divididos en 2–3 tomas. Liberación prolongada: 80–160 mg/día.',
    efectos_adversos: 'Bradicardia, broncoespasmo, fatiga, mareo, hipoglucemia enmascarada, pesadillas.',
    contraindicaciones: 'Asma, EPOC, bloqueo AV, insuficiencia cardíaca descompensada.',
    precauciones_adulto_mayor: 'Mayor riesgo de broncoespasmo. Preferir betabloqueantes cardioselectivos. No suspender bruscamente.',
    interacciones: 'Verapamilo, diltiazem, antidiabéticos, anestésicos.',
    conservacion: 'Temperatura ambiente.',
  },

  ATORVASTATINA: {
    categoria: 'Hipolipemiante. Inhibidor de HMG-CoA reductasa (estatina).',
    indicaciones: 'Hipercolesterolemia, prevención cardiovascular primaria y secundaria.',
    posologia: 'Adultos: 10–80 mg/día, una sola toma (cualquier hora del día).',
    efectos_adversos: 'Mialgias (dolores musculares), elevación de transaminasas, alteraciones digestivas. Raramente: rabdomiólisis (dolor muscular severo + orina oscura — emergencia). Riesgo leve de diabetes de novo.',
    contraindicaciones: 'Embarazo, lactancia, hepatopatía activa.',
    precauciones_adulto_mayor: 'Es la estatina de elección por interacciones menos críticas. Vigilar dolores musculares (suspender y consultar si son intensos o con debilidad). Control de perfil hepático antes de iniciar y según evolución. Reportar orina oscura inmediatamente.',
    interacciones: 'Claritromicina, eritromicina, antifúngicos azoles, ciclosporina, gemfibrozilo: aumentan riesgo de miopatía. Jugo de pomelo en grandes cantidades.',
    conservacion: 'Temperatura ambiente.',
  },

  SIMVASTATINA: {
    categoria: 'Hipolipemiante. Estatina.',
    indicaciones: 'Hipercolesterolemia, prevención cardiovascular.',
    posologia: 'Adultos: 10–40 mg/día en la noche. NO usar dosis de 80 mg por mayor riesgo de miopatía.',
    efectos_adversos: 'Mialgias, alteración hepática, dispepsia. Mayor riesgo de miopatía que atorvastatina.',
    contraindicaciones: 'Embarazo, hepatopatía activa, uso con inhibidores potentes CYP3A4.',
    precauciones_adulto_mayor: 'Limitar dosis a 20 mg/día si se combina con amlodipino o amiodarona. Reportar dolores musculares.',
    interacciones: 'Amlodipino (máx 20 mg simvastatina), amiodarona, diltiazem, claritromicina, azoles, jugo de pomelo.',
    conservacion: 'Temperatura ambiente.',
  },

  GEMFIBROZILO: {
    categoria: 'Hipolipemiante. Fibrato.',
    indicaciones: 'Hipertrigliceridemia severa, dislipidemia mixta.',
    posologia: 'Adultos: 600 mg cada 12 h, 30 min antes del desayuno y de la cena.',
    efectos_adversos: 'Molestias gastrointestinales, mialgias, litiasis biliar, alteración hepática.',
    contraindicaciones: 'Insuficiencia hepática o renal severa, enfermedad biliar.',
    precauciones_adulto_mayor: 'NO combinar con estatinas (alto riesgo de rabdomiólisis). Si requiere combinación con estatina, preferir fenofibrato.',
    interacciones: 'Estatinas (rabdomiólisis), warfarina (potencia INR), sulfonilureas.',
    conservacion: 'Temperatura ambiente.',
  },

  METFORMINA: {
    categoria: 'Antidiabético oral. Biguanida.',
    indicaciones: 'Diabetes mellitus tipo 2 (primera línea), síndrome de ovario poliquístico, prediabetes en casos seleccionados.',
    posologia: 'Adultos: inicio 500 mg con la comida principal, titulando hasta 850–1000 mg cada 12 h. Máximo 2550 mg/día. Tomar con alimentos para reducir molestias gástricas.',
    efectos_adversos: 'Diarrea, náuseas, sabor metálico (suelen ceder con el tiempo o con presentación XR). Déficit de vitamina B12 con uso prolongado. Raramente acidosis láctica (en falla renal/hepática severa).',
    contraindicaciones: 'Insuficiencia renal severa (eGFR <30), acidosis metabólica, insuficiencia hepática severa, deshidratación.',
    precauciones_adulto_mayor: 'Es el antidiabético de elección en adulto mayor por bajo riesgo de hipoglucemia. Vigilar función renal (no usar si eGFR <30, reducir dosis si 30–45). Suspender 48 h antes de cirugías o contrastes yodados. Considerar suplemento de B12 con uso prolongado.',
    interacciones: 'Contrastes yodados (acidosis láctica), alcohol (acidosis láctica), diuréticos, IECA.',
    conservacion: 'Temperatura ambiente.',
  },

  'METFORMINA + VILDAGLIPTINA': {
    categoria: 'Combinación: biguanida + inhibidor DPP-4.',
    indicaciones: 'Diabetes mellitus tipo 2 cuando metformina sola es insuficiente.',
    posologia: 'Adultos: 50/850 mg o 50/1000 mg, una tableta cada 12 h, con las comidas.',
    efectos_adversos: 'Suman los de cada componente: gastrointestinales (metformina) + nasofaringitis, cefalea, riesgo bajo de pancreatitis (vildagliptina).',
    contraindicaciones: 'Insuficiencia renal (eGFR <50 para algunas presentaciones), insuficiencia hepática, antecedente de pancreatitis.',
    precauciones_adulto_mayor: 'Bajo riesgo de hipoglucemia. Control de pruebas hepáticas antes de iniciar y periódicamente. Suspender ante dolor abdominal intenso (sospecha de pancreatitis).',
    interacciones: 'Similares a metformina sola. Vildagliptina tiene pocas interacciones.',
    conservacion: 'Temperatura ambiente.',
  },

  EMPAGLIFLOZINA: {
    categoria: 'Antidiabético oral. Inhibidor del cotransportador sodio-glucosa 2 (SGLT2).',
    indicaciones: 'Diabetes tipo 2, insuficiencia cardíaca, enfermedad renal crónica diabética.',
    posologia: 'Adultos: 10–25 mg/día por la mañana.',
    efectos_adversos: 'Infecciones genitales micóticas (frecuentes), infecciones urinarias, deshidratación, hipotensión, raramente cetoacidosis euglucémica.',
    contraindicaciones: 'Diabetes tipo 1, cetoacidosis, insuficiencia renal severa.',
    precauciones_adulto_mayor: 'Mantener hidratación adecuada. Mayor riesgo de hipotensión y caídas. Suspender ante infección severa, deshidratación, cirugía o ayuno prolongado.',
    interacciones: 'Diuréticos (deshidratación), insulina y sulfonilureas (ajustar para evitar hipoglucemia).',
    conservacion: 'Temperatura ambiente.',
  },

  LEVOTIROXINA: {
    categoria: 'Hormona tiroidea sintética (T4).',
    indicaciones: 'Hipotiroidismo de cualquier causa, bocio, supresión post-tiroidectomía por cáncer.',
    posologia: 'Adultos: dosis individualizada según TSH. Habitual 50–150 mcg/día. TOMAR EN AYUNAS, 30–60 minutos antes del desayuno, con agua.',
    efectos_adversos: 'A dosis correcta: ninguno. A dosis excesivas: palpitaciones, temblor, insomnio, pérdida de peso, intolerancia al calor, osteoporosis con uso crónico.',
    contraindicaciones: 'Tirotoxicosis no tratada, infarto agudo.',
    precauciones_adulto_mayor: 'Iniciar con dosis baja (12,5–25 mcg/día) y titular lentamente para evitar precipitar angina o arritmias. Vigilar TSH cada 6–8 semanas hasta estabilizar, luego anual. Mantener marca/laboratorio constante (la biodisponibilidad varía).',
    interacciones: 'Calcio, hierro, omeprazol, antiácidos, café (todos reducen absorción — separar 4 horas). Warfarina (aumenta efecto). Diabéticos: puede aumentar requerimientos.',
    conservacion: 'Temperatura ambiente, en envase original (sensible a humedad y luz).',
  },

  OMEPRAZOL: {
    categoria: 'Inhibidor de bomba de protones (IBP).',
    indicaciones: 'Reflujo gastroesofágico, úlcera péptica, gastritis, H. pylori (en combinación), profilaxis de úlcera por AINEs.',
    posologia: 'Adultos: 20 mg/día, 30 min antes del desayuno. Casos severos: 40 mg/día.',
    efectos_adversos: 'Cefalea, diarrea, dolor abdominal. Uso prolongado (>1 año): déficit de B12, magnesio, calcio, hierro; mayor riesgo de fracturas, neumonía, infección por C. difficile, demencia (datos controversiales).',
    contraindicaciones: 'Hipersensibilidad. Cautela con clopidogrel.',
    precauciones_adulto_mayor: 'NO usar crónicamente sin indicación clara: reevaluar necesidad cada 6 meses y desescalonar si es posible. Vigilar magnesio y vitamina B12 con uso prolongado. Mayor riesgo de fracturas vertebrales y de cadera.',
    interacciones: 'Clopidogrel (reduce efecto antiplaquetario — usar pantoprazol como alternativa). Methotrexato, tacrolimus, digoxina, levotiroxina.',
    conservacion: 'Temperatura ambiente.',
  },

  ESOMEPRAZOL: {
    categoria: 'Inhibidor de bomba de protones (IBP).',
    indicaciones: 'Mismas que omeprazol. Reflujo, úlcera, esofagitis erosiva, H. pylori.',
    posologia: 'Adultos: 20–40 mg/día, 30 min antes del desayuno.',
    efectos_adversos: 'Similares a omeprazol. Cefalea, diarrea, déficit nutricional con uso crónico.',
    contraindicaciones: 'Hipersensibilidad.',
    precauciones_adulto_mayor: 'Mismas que omeprazol. Reevaluar necesidad periódicamente.',
    interacciones: 'Clopidogrel (algo menos que omeprazol), digoxina, levotiroxina, hierro, B12.',
    conservacion: 'Temperatura ambiente.',
  },

  FAMOTIDINA: {
    categoria: 'Antagonista H2 (anti-secretor gástrico).',
    indicaciones: 'Reflujo leve, úlcera, dispepsia.',
    posologia: 'Adultos: 20–40 mg cada 12 h o 40 mg en la noche.',
    efectos_adversos: 'Cefalea, mareo, diarrea. Menos efectos a largo plazo que los IBP.',
    contraindicaciones: 'Hipersensibilidad.',
    precauciones_adulto_mayor: 'Puede causar confusión en adulto mayor con falla renal: ajustar dosis. Alternativa razonable a IBP en uso ocasional.',
    interacciones: 'Antifúngicos azoles (reducen absorción de éstos), atazanavir.',
    conservacion: 'Temperatura ambiente.',
  },

  DOMPERIDONA: {
    categoria: 'Antiemético procinético antagonista dopaminérgico periférico.',
    indicaciones: 'Náuseas, vómitos, gastroparesia, dispepsia.',
    posologia: 'Adultos: 10 mg cada 8 h, 15–30 min antes de las comidas. Máximo 30 mg/día. Tratamiento corto (máximo 1 semana).',
    efectos_adversos: 'Prolongación QT (riesgo de arritmias graves), sequedad bucal, cefalea, galactorrea.',
    contraindicaciones: 'Prolongación QT, hipokalemia, uso con fármacos que prolonguen QT, insuficiencia hepática moderada-severa.',
    precauciones_adulto_mayor: 'EVITAR en adulto mayor por riesgo cardiovascular (arritmias). Si se requiere antiemético, considerar alternativas. Si se usa, limitar a la menor dosis y duración posible.',
    interacciones: 'Antiarrítmicos, macrólidos (azitromicina, claritromicina), antifúngicos azoles, citalopram.',
    conservacion: 'Temperatura ambiente.',
  },

  SALBUTAMOL: {
    categoria: 'Broncodilatador agonista β2 de acción corta.',
    indicaciones: 'Crisis de asma, EPOC, broncoespasmo agudo.',
    posologia: 'Inhalador: 1–2 puffs (100 mcg/puff) cada 4–6 h según necesidad. En crisis: 4–8 puffs con aerocámara.',
    efectos_adversos: 'Temblor fino, palpitaciones, taquicardia, cefalea, hipokalemia con uso intensivo.',
    contraindicaciones: 'Hipersensibilidad. Precaución en cardiopatía, hipertiroidismo, diabetes.',
    precauciones_adulto_mayor: 'Usar SIEMPRE con aerocámara para mejor depósito pulmonar y menos efectos sistémicos. Si requiere uso frecuente (>2 veces/semana), consultar — indica mal control del asma.',
    interacciones: 'Betabloqueantes (antagonizan el efecto, riesgo de broncoespasmo grave). Diuréticos (hipokalemia).',
    conservacion: 'Temperatura ambiente. Inhalador: no perforar ni exponer al calor.',
  },

  LORATADINA: {
    categoria: 'Antihistamínico H1 de segunda generación, no sedante.',
    indicaciones: 'Rinitis alérgica, urticaria, prurito.',
    posologia: 'Adultos: 10 mg una vez al día.',
    efectos_adversos: 'Cefalea, somnolencia leve (menos que los de primera generación), sequedad bucal.',
    contraindicaciones: 'Hipersensibilidad. Cautela en insuficiencia hepática.',
    precauciones_adulto_mayor: 'Buena opción por mínima sedación. Reducir a días alternos si hay falla hepática severa.',
    interacciones: 'Mínimas. Inhibidores CYP3A4 pueden aumentar niveles.',
    conservacion: 'Temperatura ambiente.',
  },

  CETIRIZINA: {
    categoria: 'Antihistamínico H1 de segunda generación.',
    indicaciones: 'Rinitis alérgica, urticaria crónica, prurito.',
    posologia: 'Adultos: 10 mg una vez al día, preferentemente en la noche.',
    efectos_adversos: 'Somnolencia (más que loratadina), sequedad bucal, fatiga.',
    contraindicaciones: 'Insuficiencia renal severa.',
    precauciones_adulto_mayor: 'Reducir dosis a 5 mg/día si hay falla renal. Cuidar somnolencia y riesgo de caídas.',
    interacciones: 'Alcohol y depresores del SNC (potencia sedación).',
    conservacion: 'Temperatura ambiente.',
  },

  LEVOCETIRIZINA: {
    categoria: 'Antihistamínico H1 segunda generación (isómero activo de cetirizina).',
    indicaciones: 'Rinitis alérgica, urticaria.',
    posologia: 'Adultos: 5 mg una vez al día, en la noche.',
    efectos_adversos: 'Somnolencia (menor que cetirizina), fatiga, sequedad bucal.',
    contraindicaciones: 'Insuficiencia renal severa.',
    precauciones_adulto_mayor: 'Ajustar dosis en falla renal.',
    interacciones: 'Alcohol, depresores del SNC.',
    conservacion: 'Temperatura ambiente.',
  },

  FEXOFENADINA: {
    categoria: 'Antihistamínico H1 segunda generación no sedante.',
    indicaciones: 'Rinitis alérgica estacional, urticaria crónica.',
    posologia: 'Adultos: 120–180 mg una vez al día. No tomar con jugo de fruta (reduce absorción).',
    efectos_adversos: 'Cefalea, náuseas leves. Muy baja sedación.',
    contraindicaciones: 'Hipersensibilidad.',
    precauciones_adulto_mayor: 'Excelente opción por mínima sedación y pocas interacciones.',
    interacciones: 'Antiácidos con aluminio/magnesio (reducen absorción — separar 2 h).',
    conservacion: 'Temperatura ambiente.',
  },

  BILASTINA: {
    categoria: 'Antihistamínico H1 de segunda generación, no sedante.',
    indicaciones: 'Rinitis alérgica, urticaria.',
    posologia: 'Adultos: 20 mg/día, 1 hora antes o 2 después de comer (los alimentos reducen absorción).',
    efectos_adversos: 'Mínimos. Cefalea leve.',
    contraindicaciones: 'Hipersensibilidad.',
    precauciones_adulto_mayor: 'Muy buen perfil, sin sedación ni interacciones cardiacas relevantes.',
    interacciones: 'Jugo de pomelo, ketoconazol, eritromicina (aumentan niveles).',
    conservacion: 'Temperatura ambiente.',
  },

  CLORFENAMINA: {
    categoria: 'Antihistamínico H1 de primera generación.',
    indicaciones: 'Rinitis, urticaria, reacciones alérgicas, en combinaciones para resfrío.',
    posologia: 'Adultos: 4 mg cada 4–6 h. Máximo 24 mg/día.',
    efectos_adversos: 'Somnolencia marcada, sequedad bucal, visión borrosa, retención urinaria, estreñimiento, taquicardia (efecto anticolinérgico).',
    contraindicaciones: 'Glaucoma de ángulo estrecho, hiperplasia prostática, retención urinaria, asma agudo.',
    precauciones_adulto_mayor: 'EVITAR en adulto mayor (criterios Beers): alto riesgo de confusión, caídas, retención urinaria, estreñimiento y sequedad. Preferir antihistamínicos de segunda generación (loratadina, cetirizina, bilastina).',
    interacciones: 'Alcohol, benzodiazepinas, opioides, otros anticolinérgicos (potencia efectos).',
    conservacion: 'Temperatura ambiente.',
  },

  PSEUDOEFEDRINA: {
    categoria: 'Descongestionante simpaticomimético sistémico.',
    indicaciones: 'Congestión nasal por resfrío, rinitis.',
    posologia: 'Adultos: 30–60 mg cada 4–6 h. Máximo 240 mg/día.',
    efectos_adversos: 'Insomnio, nerviosismo, palpitaciones, hipertensión, retención urinaria.',
    contraindicaciones: 'Hipertensión severa, cardiopatía isquémica, hipertiroidismo, glaucoma, hiperplasia prostática, uso de IMAO.',
    precauciones_adulto_mayor: 'EVITAR en adulto mayor con hipertensión o cardiopatía. Si se usa, dosis bajas y por pocos días. Preferir descongestionantes tópicos por corto tiempo.',
    interacciones: 'IMAO (crisis hipertensiva), antihipertensivos (antagoniza efecto), otros estimulantes.',
    conservacion: 'Temperatura ambiente.',
  },

  AMBROXOL: {
    categoria: 'Mucolítico/expectorante.',
    indicaciones: 'Tos productiva con secreciones espesas, bronquitis aguda y crónica.',
    posologia: 'Adultos: 30 mg cada 8 h o 60 mg cada 12 h. Tomar con abundante líquido.',
    efectos_adversos: 'Náuseas, sabor desagradable, raramente reacciones cutáneas (Stevens-Johnson).',
    contraindicaciones: 'Hipersensibilidad. Úlcera péptica (relativa).',
    precauciones_adulto_mayor: 'Ingerir abundante agua para potenciar efecto fluidificante. Vigilar reacciones cutáneas.',
    interacciones: 'Antitusivos: no combinar (acumula secreciones).',
    conservacion: 'Temperatura ambiente.',
  },

  OXOLAMINA: {
    categoria: 'Antitusivo no opioide.',
    indicaciones: 'Tos seca irritativa.',
    posologia: 'Adultos: 100 mg cada 8 h o jarabe según presentación.',
    efectos_adversos: 'Náuseas, mareo, somnolencia leve.',
    contraindicaciones: 'Hipersensibilidad.',
    precauciones_adulto_mayor: 'No usar en tos productiva (puede retener secreciones). Útil para tos nocturna irritativa.',
    interacciones: 'Depresores del SNC (sedación).',
    conservacion: 'Temperatura ambiente.',
  },

  SILDENAFIL: {
    categoria: 'Inhibidor de la fosfodiesterasa-5 (PDE5).',
    indicaciones: 'Disfunción eréctil, hipertensión pulmonar.',
    posologia: 'Disfunción eréctil: 50 mg unos 30–60 min antes de la actividad sexual. Rango 25–100 mg. No más de una vez al día.',
    efectos_adversos: 'Cefalea, rubor facial, congestión nasal, dispepsia, alteraciones visuales (visión azulada), hipotensión. Raramente: pérdida brusca de visión o audición — emergencia.',
    contraindicaciones: 'Uso de nitratos (riesgo de hipotensión severa). Cardiopatía severa, infarto reciente, hipotensión. Insuficiencia hepática severa.',
    precauciones_adulto_mayor: 'Iniciar con 25 mg. Vigilar interacciones con antihipertensivos (especialmente alfa-bloqueantes como tamsulosina). NO usar con nitratos bajo ninguna forma. Consultar a cardiólogo si hay cardiopatía.',
    interacciones: 'NITRATOS (absoluta), alfa-bloqueantes (hipotensión), inhibidores CYP3A4 (ketoconazol, claritromicina — reducir dosis).',
    conservacion: 'Temperatura ambiente.',
  },

  TADALAFILO: {
    categoria: 'Inhibidor PDE5 de acción prolongada.',
    indicaciones: 'Disfunción eréctil, hiperplasia prostática benigna, hipertensión pulmonar.',
    posologia: 'A demanda: 10–20 mg 30 min antes (efecto hasta 36 h). Diario: 2,5–5 mg/día.',
    efectos_adversos: 'Cefalea, rubor, dolor de espalda y muscular, dispepsia, congestión nasal.',
    contraindicaciones: 'Uso con nitratos, infarto reciente, hipotensión, cardiopatía grave.',
    precauciones_adulto_mayor: 'Similar a sildenafil. La dosis diaria baja también ayuda en HPB.',
    interacciones: 'Nitratos (absoluta), alfa-bloqueantes, inhibidores CYP3A4.',
    conservacion: 'Temperatura ambiente.',
  },

  PREGABALINA: {
    categoria: 'Antiepiléptico/neuromodulador. Análogo de GABA.',
    indicaciones: 'Dolor neuropático (neuralgia post-herpética, neuropatía diabética), fibromialgia, epilepsia parcial, trastorno de ansiedad generalizada.',
    posologia: 'Adultos: inicio 75 mg cada 12 h, titular hasta 150–300 mg cada 12 h.',
    efectos_adversos: 'Mareo, somnolencia, edema periférico, aumento de peso, visión borrosa, ataxia. Potencial de abuso.',
    contraindicaciones: 'Hipersensibilidad. Cautela en falla renal.',
    precauciones_adulto_mayor: 'ALTO riesgo de caídas y confusión. Iniciar con 25–50 mg/día y titular muy lentamente. Ajustar a función renal. NO suspender bruscamente.',
    interacciones: 'Opioides, benzodiazepinas, alcohol (depresión respiratoria, sedación severa).',
    conservacion: 'Temperatura ambiente.',
  },

  GABAPENTINA: {
    categoria: 'Antiepiléptico/neuromodulador.',
    indicaciones: 'Dolor neuropático, epilepsia parcial.',
    posologia: 'Adultos: inicio 300 mg/día, titular hasta 900–3600 mg/día en 3 tomas.',
    efectos_adversos: 'Somnolencia, mareo, edema, ataxia, aumento de peso.',
    contraindicaciones: 'Hipersensibilidad.',
    precauciones_adulto_mayor: 'Mismas que pregabalina: riesgo de caídas y confusión. Ajustar a función renal. Titular lento.',
    interacciones: 'Opioides, depresores del SNC, antiácidos (separar 2 h).',
    conservacion: 'Temperatura ambiente.',
  },

  QUETIAPINA: {
    categoria: 'Antipsicótico atípico.',
    indicaciones: 'Esquizofrenia, trastorno bipolar, depresión mayor (adyuvante). Uso off-label frecuente para insomnio.',
    posologia: 'Variable. Esquizofrenia/bipolar: 300–800 mg/día. Insomnio off-label: 25–50 mg en la noche.',
    efectos_adversos: 'Sedación marcada, ganancia de peso, hipotensión ortostática, alteraciones metabólicas, prolongación QT, síndrome metabólico.',
    contraindicaciones: 'Hipersensibilidad, uso con fármacos que prolonguen QT.',
    precauciones_adulto_mayor: 'EVITAR uso para insomnio o agitación en demencia (advertencia FDA por aumento de mortalidad). Si se usa para indicación psiquiátrica, dosis mínimas. Riesgo de caídas.',
    interacciones: 'Otros depresores del SNC, fármacos QT-prolongadores, inhibidores CYP3A4.',
    conservacion: 'Temperatura ambiente.',
  },

  RISPERIDONA: {
    categoria: 'Antipsicótico atípico.',
    indicaciones: 'Esquizofrenia, trastorno bipolar, agresividad asociada a autismo.',
    posologia: 'Adultos: 2–6 mg/día.',
    efectos_adversos: 'Síntomas extrapiramidales, hiperprolactinemia, sedación, hipotensión, aumento de peso.',
    contraindicaciones: 'Hipersensibilidad.',
    precauciones_adulto_mayor: 'EVITAR en demencia (aumento de mortalidad y ACV). Iniciar con 0,25–0,5 mg si su uso es indispensable. Riesgo de parkinsonismo.',
    interacciones: 'Antihipertensivos, depresores del SNC, levodopa (antagonismo).',
    conservacion: 'Temperatura ambiente.',
  },

  SERTRALINA: {
    categoria: 'Antidepresivo. Inhibidor selectivo de la recaptación de serotonina (ISRS).',
    indicaciones: 'Depresión, ansiedad generalizada, trastorno de pánico, TOC, TEPT.',
    posologia: 'Adultos: inicio 25–50 mg/día, mantener 50–200 mg/día. Tomar en la mañana con alimentos.',
    efectos_adversos: 'Náuseas (al inicio), diarrea, insomnio o somnolencia, disfunción sexual, sudoración, temblor. Hiponatremia (sobre todo en adulto mayor).',
    contraindicaciones: 'Uso simultáneo de IMAO, alergia.',
    precauciones_adulto_mayor: 'Es el ISRS más recomendado en adulto mayor por menos interacciones. Vigilar sodio (riesgo de hiponatremia/SIADH), especialmente las primeras semanas. Reportar caídas, debilidad, confusión. Suspender gradualmente.',
    interacciones: 'IMAO, otros serotoninérgicos (síndrome serotoninérgico), AINEs y anticoagulantes (sangrado), warfarina.',
    conservacion: 'Temperatura ambiente.',
  },

  ESCITALOPRAM: {
    categoria: 'Antidepresivo ISRS.',
    indicaciones: 'Depresión, ansiedad generalizada, pánico, fobia social.',
    posologia: 'Adultos: 10–20 mg/día. Adultos mayores: máximo 10 mg/día.',
    efectos_adversos: 'Náuseas, insomnio, disfunción sexual, sudoración, hiponatremia, prolongación QT.',
    contraindicaciones: 'IMAO, prolongación QT, alergia.',
    precauciones_adulto_mayor: 'Máximo 10 mg/día por riesgo de QT. Vigilar sodio.',
    interacciones: 'IMAO, fármacos QT-prolongadores (macrólidos, antipsicóticos), AINEs.',
    conservacion: 'Temperatura ambiente.',
  },

  FLUOXETINA: {
    categoria: 'Antidepresivo ISRS de vida media larga.',
    indicaciones: 'Depresión, TOC, bulimia, trastorno disfórico premenstrual.',
    posologia: 'Adultos: 20–60 mg/día por la mañana.',
    efectos_adversos: 'Insomnio, agitación, náuseas, disfunción sexual, hiponatremia, sangrado.',
    contraindicaciones: 'IMAO (esperar 5 semanas tras suspender fluoxetina por su vida media).',
    precauciones_adulto_mayor: 'Larga vida media puede ser problema en adulto mayor (acumulación). Vigilar interacciones y sodio.',
    interacciones: 'IMAO, AINEs, anticoagulantes, tamoxifeno (reduce eficacia), tramadol (síndrome serotoninérgico).',
    conservacion: 'Temperatura ambiente.',
  },

  ALPRAZOLAM: {
    categoria: 'Benzodiazepina de vida media corta-intermedia.',
    indicaciones: 'Trastorno de pánico, ansiedad.',
    posologia: 'Adultos: 0,25–0,5 mg cada 8 h. Máximo 4 mg/día.',
    efectos_adversos: 'Sedación, ataxia, deterioro cognitivo, amnesia anterógrada, dependencia, tolerancia, depresión respiratoria con opioides.',
    contraindicaciones: 'Glaucoma agudo, insuficiencia respiratoria severa, miastenia, apnea del sueño.',
    precauciones_adulto_mayor: 'EVITAR (criterios Beers): alto riesgo de caídas, fracturas, confusión, accidentes y dependencia. Si ya está en tratamiento crónico, NO suspender bruscamente — desescalar lentamente con apoyo profesional.',
    interacciones: 'Opioides (depresión respiratoria, muerte), alcohol, antidepresivos sedantes, antifúngicos azoles.',
    conservacion: 'Temperatura ambiente.',
  },

  CLONAZEPAM: {
    categoria: 'Benzodiazepina de vida media larga.',
    indicaciones: 'Epilepsia, trastorno de pánico, ansiedad.',
    posologia: 'Adultos: 0,5–2 mg/día divididos en 2–3 tomas.',
    efectos_adversos: 'Sedación, mareo, ataxia, deterioro cognitivo, depresión, dependencia.',
    contraindicaciones: 'Glaucoma agudo, miastenia, insuficiencia respiratoria.',
    precauciones_adulto_mayor: 'EVITAR (criterios Beers). Vida media muy larga: alto riesgo de acumulación y caídas. Desescalar gradualmente.',
    interacciones: 'Opioides, alcohol, otros sedantes.',
    conservacion: 'Temperatura ambiente.',
  },

  ZOPICLONA: {
    categoria: 'Hipnótico no-benzodiazepínico (Z-drug).',
    indicaciones: 'Insomnio de corta duración.',
    posologia: 'Adultos: 3,75–7,5 mg en la noche, justo antes de acostarse. Máximo 4 semanas.',
    efectos_adversos: 'Sabor metálico/amargo, somnolencia residual, ataxia, amnesia, dependencia.',
    contraindicaciones: 'Apnea severa, miastenia, insuficiencia hepática severa.',
    precauciones_adulto_mayor: 'EVITAR (criterios Beers): igual riesgo de caídas y deterioro cognitivo que benzodiazepinas. Si se usa, máximo 3,75 mg y por pocos días. Higiene del sueño debe ser primera opción.',
    interacciones: 'Alcohol, depresores SNC, opioides.',
    conservacion: 'Temperatura ambiente.',
  },

  MELATONINA: {
    categoria: 'Hormona reguladora del ritmo circadiano.',
    indicaciones: 'Insomnio (especialmente conciliación), jet lag, trastornos del sueño en mayores.',
    posologia: 'Adultos: 1–5 mg 30–60 min antes de dormir.',
    efectos_adversos: 'Somnolencia diurna, cefalea, mareo, sueños vívidos.',
    contraindicaciones: 'Hipersensibilidad. Cautela en autoinmunes y epilepsia.',
    precauciones_adulto_mayor: 'Opción preferida sobre hipnóticos en insomnio del adulto mayor. Dosis bajas (1–2 mg) suelen ser suficientes. Combinar con higiene del sueño.',
    interacciones: 'Anticoagulantes, antidiabéticos, fluvoxamina (aumenta niveles).',
    conservacion: 'Temperatura ambiente.',
  },

  TRAMADOL: {
    categoria: 'Analgésico opioide débil con efecto serotoninérgico.',
    indicaciones: 'Dolor moderado a severo.',
    posologia: 'Adultos: 50–100 mg cada 6–8 h. Máximo 400 mg/día.',
    efectos_adversos: 'Náuseas, vómitos, mareo, somnolencia, estreñimiento, sequedad bucal, convulsiones (dosis altas o predispuestos), síndrome serotoninérgico con antidepresivos, dependencia.',
    contraindicaciones: 'Epilepsia mal controlada, intoxicación aguda con alcohol u otros depresores, uso con IMAO.',
    precauciones_adulto_mayor: 'Alto riesgo de caídas, confusión, hiponatremia y náuseas. Iniciar con dosis baja (25 mg) y ampliar intervalos. Tratar profilácticamente el estreñimiento.',
    interacciones: 'ISRS, IRSN, tricíclicos, IMAO (síndrome serotoninérgico). Carbamazepina (reduce eficacia). Warfarina (potencia).',
    conservacion: 'Temperatura ambiente.',
  },

  'PARACETAMOL + TRAMADOL': {
    categoria: 'Combinación analgésica: paracetamol + opioide débil.',
    indicaciones: 'Dolor moderado a severo agudo o crónico cuando paracetamol solo es insuficiente.',
    posologia: 'Adultos: 1–2 comprimidos (325/37,5 mg cada uno) cada 6 h. Máximo 8 al día.',
    efectos_adversos: 'Náuseas, somnolencia, mareo, estreñimiento, sequedad bucal.',
    contraindicaciones: 'Igual que tramadol. Hepatopatía severa.',
    precauciones_adulto_mayor: 'Dosis baja al inicio. Vigilar caídas, estreñimiento, confusión, hiponatremia.',
    interacciones: 'Igual que tramadol: ISRS, IRSN, IMAO, alcohol.',
    conservacion: 'Temperatura ambiente.',
  },

  'VITAMINA C': {
    categoria: 'Ácido ascórbico. Vitamina hidrosoluble antioxidante.',
    indicaciones: 'Prevención y tratamiento del déficit. Apoyo inmune. Cofactor en síntesis de colágeno.',
    posologia: 'Adultos: 60–1000 mg/día. Dosis altas (>2 g) no aportan beneficio adicional y pueden causar problemas.',
    efectos_adversos: 'A dosis altas: diarrea, molestias gástricas, cálculos renales (oxalatos), interferencia en glicemia capilar.',
    contraindicaciones: 'Cálculos renales por oxalatos, hemocromatosis (aumenta absorción de hierro).',
    precauciones_adulto_mayor: 'Limitar a 500–1000 mg/día. Hidratación adecuada.',
    interacciones: 'Aumenta absorción de hierro. Puede interferir con warfarina a dosis muy altas.',
    conservacion: 'Temperatura ambiente, protegido de luz y humedad.',
  },

  'VITAMINA D3': {
    categoria: 'Colecalciferol. Vitamina liposoluble.',
    indicaciones: 'Déficit de vitamina D, prevención de osteoporosis y caídas en adulto mayor, raquitismo.',
    posologia: 'Adultos: 800–2000 UI/día (mantención). En déficit confirmado: dosis de carga según indicación médica.',
    efectos_adversos: 'A dosis correctas: ninguno. Toxicidad por sobredosis crónica: hipercalcemia, náuseas, debilidad, cálculos renales.',
    contraindicaciones: 'Hipercalcemia, hipervitaminosis D, sarcoidosis activa.',
    precauciones_adulto_mayor: 'Recomendado para prevención de osteoporosis y caídas (800–2000 UI/día). Idealmente medir niveles séricos antes de dosis altas. Combinar con calcio si la ingesta dietaria es insuficiente.',
    interacciones: 'Diuréticos tiazídicos (hipercalcemia), corticoides (reducen efecto), anticonvulsivantes (reducen efecto).',
    conservacion: 'Temperatura ambiente.',
  },

  'ACIDO FOLICO': {
    categoria: 'Vitamina B9 hidrosoluble.',
    indicaciones: 'Anemia megaloblástica por déficit, prevención de defectos del tubo neural en embarazo (preconcepcional y 1er trimestre), suplementación en hemodiálisis y con metotrexato.',
    posologia: 'Prevención: 400 mcg/día. Tratamiento de déficit: 1–5 mg/día.',
    efectos_adversos: 'Generalmente bien tolerado. Puede enmascarar déficit de B12 (anemia perniciosa).',
    contraindicaciones: 'Hipersensibilidad. NO usar sin B12 si hay sospecha de déficit de B12 (puede empeorar daño neurológico).',
    precauciones_adulto_mayor: 'Siempre descartar déficit de B12 antes/durante suplementación con ácido fólico.',
    interacciones: 'Metotrexato (rescate), fenitoína, sulfasalazina.',
    conservacion: 'Temperatura ambiente.',
  },

  CIANOCOBALAMINA: {
    categoria: 'Vitamina B12.',
    indicaciones: 'Anemia perniciosa, déficit de B12 (vegetarianos, gastritis atrófica, post-gastrectomía, uso crónico de metformina/IBP), neuropatía por déficit.',
    posologia: 'Oral: 1000 mcg/día. Inyectable: según pauta médica.',
    efectos_adversos: 'Mínimos. Rash, prurito.',
    contraindicaciones: 'Hipersensibilidad.',
    precauciones_adulto_mayor: 'Frecuente déficit subclínico en adulto mayor (>10%). Medir niveles si hay fatiga, anemia macrocítica, neuropatía o uso crónico de metformina/omeprazol.',
    interacciones: 'Cloranfenicol, omeprazol, metformina (reducen absorción).',
    conservacion: 'Temperatura ambiente, protegido de luz.',
  },

  'HIALURONATO DE SODIO': {
    categoria: 'Lubricante oftálmico (lágrimas artificiales) o intraarticular.',
    indicaciones: 'Ojo seco, irritación ocular, lubricación articular en artrosis (inyectable).',
    posologia: 'Oftálmico: 1 gota en cada ojo 3–6 veces al día o según necesidad.',
    efectos_adversos: 'Irritación leve transitoria. Visión borrosa pasajera.',
    contraindicaciones: 'Hipersensibilidad.',
    precauciones_adulto_mayor: 'Preferir presentación sin preservantes si requiere uso muy frecuente o crónico. Esperar 10 min antes de aplicar otro colirio.',
    interacciones: 'Ninguna relevante.',
    conservacion: 'Temperatura ambiente. Frasco abierto: usar dentro de 30 días (con preservante) o 12 h (monodosis sin preservante).',
  },

  CLOBETASOL: {
    categoria: 'Corticoide tópico de muy alta potencia.',
    indicaciones: 'Psoriasis, dermatitis severas, liquen plano, alopecia areata.',
    posologia: 'Aplicar capa fina 1–2 veces al día. Máximo 2 semanas continuas. No superar 50 g/semana.',
    efectos_adversos: 'Atrofia cutánea, estrías, telangiectasias, hipopigmentación, foliculitis, supresión adrenal con uso extenso/prolongado.',
    contraindicaciones: 'Infecciones cutáneas no tratadas, rosácea, dermatitis perioral, no usar en cara, axilas o pliegues.',
    precauciones_adulto_mayor: 'Piel adulto mayor más frágil: alto riesgo de atrofia. Limitar uso a corto plazo y áreas pequeñas. No usar bajo apósito oclusivo sin indicación.',
    interacciones: 'No relevantes por uso tópico estándar.',
    conservacion: 'Temperatura ambiente.',
  },

  BETAMETASONA: {
    categoria: 'Corticoide de potencia alta. Presentaciones tópicas, sistémicas e inyectables.',
    indicaciones: 'Dermatosis inflamatorias, alergias, asma severa, enfermedades reumáticas.',
    posologia: 'Tópico: 1–2 veces al día. Oral/inyectable: según indicación.',
    efectos_adversos: 'Tópico: atrofia, telangiectasias. Sistémico: hiperglucemia, hipertensión, osteoporosis, supresión adrenal, ganancia de peso, cataratas.',
    contraindicaciones: 'Infecciones no controladas, herpes ocular (tópico).',
    precauciones_adulto_mayor: 'Uso sistémico crónico: alto riesgo de osteoporosis, diabetes, cataratas e infecciones. Justificar bien la indicación y revisar periódicamente.',
    interacciones: 'AINEs (úlcera), antidiabéticos (hiperglucemia), vacunas vivas.',
    conservacion: 'Temperatura ambiente.',
  },

  PREDNISONA: {
    categoria: 'Corticoide sistémico oral.',
    indicaciones: 'Enfermedades autoinmunes, asma severa, EPOC exacerbado, dermatosis, prevención de rechazo.',
    posologia: 'Variable: 5–60 mg/día según indicación. Tomar en la mañana con alimentos.',
    efectos_adversos: 'Hiperglucemia, hipertensión, osteoporosis, miopatía, cataratas, glaucoma, infecciones, alteración del ánimo, insomnio, ganancia de peso, cara de luna.',
    contraindicaciones: 'Infecciones sistémicas no tratadas, úlcera activa.',
    precauciones_adulto_mayor: 'Riesgo elevado de descompensar diabetes/HTA, fracturas (suplementar Ca/D), cataratas. NO suspender bruscamente cursos largos: descenso gradual.',
    interacciones: 'AINEs (úlcera), antidiabéticos (hiperglucemia), warfarina, vacunas vivas (contraindicadas).',
    conservacion: 'Temperatura ambiente.',
  },

  WARFARINA: {
    categoria: 'Anticoagulante oral antagonista de vitamina K.',
    indicaciones: 'Prevención de tromboembolismo en fibrilación auricular, prótesis valvular, TVP/EP.',
    posologia: 'Dosis individualizada según INR (objetivo habitual 2,0–3,0). Tomar a la misma hora cada día.',
    efectos_adversos: 'Sangrado (gingival, nasal, digestivo, urinario, cerebral). Necrosis cutánea rara.',
    contraindicaciones: 'Embarazo, sangrado activo, cirugía reciente, hipertensión severa no controlada.',
    precauciones_adulto_mayor: 'Control estricto de INR. Vigilar caídas (riesgo de hemorragia cerebral). Mantener ingesta estable de verduras verdes (vitamina K). Reportar cualquier sangrado, hematomas anormales, cefalea súbita.',
    interacciones: 'MUCHAS: AINEs, aspirina, antibióticos (especialmente metronidazol, fluconazol, cotrimoxazol), amiodarona, estatinas, omeprazol. Consulte siempre antes de iniciar/suspender cualquier medicamento.',
    conservacion: 'Temperatura ambiente.',
  },

  ZINC: {
    categoria: 'Oligoelemento esencial.',
    indicaciones: 'Déficit de zinc, apoyo inmune, cicatrización, acrodermatitis enteropática.',
    posologia: 'Adultos: 15–40 mg/día. No exceder 40 mg/día sin indicación.',
    efectos_adversos: 'Náuseas, sabor metálico, déficit de cobre con uso prolongado a dosis altas.',
    contraindicaciones: 'Hemocromatosis.',
    precauciones_adulto_mayor: 'No exceder 25 mg/día en uso prolongado para no inducir déficit de cobre.',
    interacciones: 'Reduce absorción de quinolonas, tetraciclinas, hierro, levotiroxina (separar 2 h).',
    conservacion: 'Temperatura ambiente.',
  },

  'GLUCOSAMINA + CONDROITINA': {
    categoria: 'Suplemento sintomático para artrosis.',
    indicaciones: 'Artrosis leve a moderada (especialmente rodilla).',
    posologia: 'Adultos: 1500 mg glucosamina + 1200 mg condroitina/día.',
    efectos_adversos: 'Molestias digestivas leves. Cefalea, somnolencia raros.',
    contraindicaciones: 'Alergia a mariscos (glucosamina puede derivar de crustáceos).',
    precauciones_adulto_mayor: 'Evidencia modesta y heterogénea. Algunos pacientes refieren alivio. Si tras 3 meses no hay mejoría, suspender.',
    interacciones: 'Posible interacción con warfarina (vigilar INR).',
    conservacion: 'Temperatura ambiente.',
  },

  PROBIOTICOS: {
    categoria: 'Microorganismos vivos que favorecen el equilibrio de la microbiota intestinal.',
    indicaciones: 'Prevención y tratamiento de diarrea (asociada a antibióticos, infecciosa), colon irritable, apoyo digestivo.',
    posologia: 'Variable según cepa y producto. Ver etiqueta. Tomar separado del antibiótico al menos 2 horas.',
    efectos_adversos: 'Gases, distensión leve transitoria.',
    contraindicaciones: 'Inmunosupresión severa, catéteres centrales (riesgo de translocación), pancreatitis aguda severa.',
    precauciones_adulto_mayor: 'Generalmente seguro. Útil junto con antibióticos para prevenir diarrea por C. difficile.',
    interacciones: 'Antibióticos (separar tomas).',
    conservacion: 'Según etiqueta — muchos requieren refrigeración.',
  },

  IVERMECTINA: {
    categoria: 'Antiparasitario.',
    indicaciones: 'Pediculosis, escabiosis (sarna), estrongiloidiasis. Rosácea (tópica).',
    posologia: 'Sarna/escabiosis: dosis única oral 200 mcg/kg, repetir a los 7–14 días. Tópico según indicación.',
    efectos_adversos: 'Prurito transitorio, cefalea, mareo, náuseas.',
    contraindicaciones: 'Hipersensibilidad. Cautela en hepatopatía.',
    precauciones_adulto_mayor: 'Bien tolerado. Tratar simultáneamente a contactos cercanos en escabiosis.',
    interacciones: 'Warfarina (potencia).',
    conservacion: 'Temperatura ambiente.',
  },

  LIDOCAINA: {
    categoria: 'Anestésico local tipo amida.',
    indicaciones: 'Anestesia local, antiarrítmico (IV), dolor neuropático localizado (parches).',
    posologia: 'Variable según presentación. Tópica/spray: aplicar según necesidad sobre la zona.',
    efectos_adversos: 'Reacciones locales. Sistémicas con sobredosis: arritmias, convulsiones, depresión SNC.',
    contraindicaciones: 'Alergia a anestésicos amídicos, bloqueo AV severo.',
    precauciones_adulto_mayor: 'Por vía sistémica reducir dosis. Tópica es segura en zonas pequeñas.',
    interacciones: 'Antiarrítmicos, betabloqueantes (potencian toxicidad).',
    conservacion: 'Temperatura ambiente.',
  },

  CICLOBENZAPRINA: {
    categoria: 'Relajante muscular de acción central, estructura tricíclica.',
    indicaciones: 'Espasmo muscular agudo asociado a dolor musculoesquelético.',
    posologia: 'Adultos: 5–10 mg cada 8 h. Tratamiento corto (máximo 2–3 semanas).',
    efectos_adversos: 'Sedación marcada, sequedad bucal, mareo, visión borrosa, retención urinaria, estreñimiento (efectos anticolinérgicos).',
    contraindicaciones: 'Glaucoma agudo, hipertiroidismo, arritmias, infarto reciente, retención urinaria, uso con IMAO.',
    precauciones_adulto_mayor: 'EVITAR (criterios Beers): efectos anticolinérgicos peligrosos — confusión, caídas, retención urinaria. Si se usa, dosis mínima por pocos días.',
    interacciones: 'IMAO (síndrome serotoninérgico/hipertensivo), depresores SNC, anticolinérgicos.',
    conservacion: 'Temperatura ambiente.',
  },

  'PARGEVERINA CLORHIDRATO': {
    categoria: 'Antiespasmódico anticolinérgico.',
    indicaciones: 'Cólicos abdominales, dismenorrea, espasmos digestivos.',
    posologia: 'Adultos: 5–10 mg cada 6–8 h.',
    efectos_adversos: 'Sequedad bucal, visión borrosa, retención urinaria, estreñimiento, taquicardia.',
    contraindicaciones: 'Glaucoma, hiperplasia prostática, íleo paralítico, miastenia.',
    precauciones_adulto_mayor: 'Cautela por efectos anticolinérgicos: caídas, confusión, retención urinaria.',
    interacciones: 'Otros anticolinérgicos.',
    conservacion: 'Temperatura ambiente.',
  },

  ALBENDAZOL: {
    categoria: 'Antiparasitario antihelmíntico de amplio espectro.',
    indicaciones: 'Oxiuros, áscaris, anquilostomas, tricocéfalos, giardiasis, hidatidosis, neurocisticercosis.',
    posologia: 'Adultos: 400 mg dosis única (oxiuros, repetir a las 2 semanas). Otras parasitosis según indicación.',
    efectos_adversos: 'Náuseas, dolor abdominal, cefalea. En tratamientos prolongados: hepatotoxicidad, leucopenia.',
    contraindicaciones: 'Embarazo (1er trimestre).',
    precauciones_adulto_mayor: 'Tratamientos cortos son seguros. Tratamientos largos requieren control hepático y hemograma.',
    interacciones: 'Inductores hepáticos (carbamazepina, fenitoína).',
    conservacion: 'Temperatura ambiente.',
  },

  ARIPIPRAZOL: {
    categoria: 'Antipsicótico atípico, agonista parcial dopaminérgico.',
    indicaciones: 'Esquizofrenia, trastorno bipolar, depresión resistente (adyuvante), irritabilidad en autismo.',
    posologia: 'Adultos: 10–30 mg/día.',
    efectos_adversos: 'Acatisia, insomnio, náuseas, cefalea. Menor ganancia de peso y sedación que otros antipsicóticos.',
    contraindicaciones: 'Hipersensibilidad.',
    precauciones_adulto_mayor: 'EVITAR en demencia (mayor mortalidad como otros antipsicóticos). Si se usa, iniciar con 5 mg.',
    interacciones: 'Inductores e inhibidores CYP3A4 y CYP2D6.',
    conservacion: 'Temperatura ambiente.',
  },

  DULOXETINA: {
    categoria: 'Antidepresivo IRSN (recaptación de serotonina y noradrenalina).',
    indicaciones: 'Depresión, ansiedad generalizada, dolor neuropático diabético, fibromialgia, dolor crónico musculoesquelético.',
    posologia: 'Adultos: 30–60 mg/día. Tomar con o sin alimentos.',
    efectos_adversos: 'Náuseas, sequedad bucal, somnolencia o insomnio, sudoración, hipertensión, disfunción sexual, hiponatremia.',
    contraindicaciones: 'Glaucoma ángulo estrecho no tratado, IMAO, insuficiencia hepática severa.',
    precauciones_adulto_mayor: 'Iniciar con 30 mg. Vigilar presión arterial y sodio. NO suspender bruscamente.',
    interacciones: 'IMAO, otros serotoninérgicos, anticoagulantes, AINEs, inhibidores CYP1A2 y CYP2D6.',
    conservacion: 'Temperatura ambiente.',
  },

  TAMSULOSINA: {
    categoria: 'Alfa-bloqueante uroselectivo.',
    indicaciones: 'Hiperplasia prostática benigna sintomática.',
    posologia: 'Adultos: 0,4 mg/día, 30 min después de la misma comida cada día.',
    efectos_adversos: 'Hipotensión ortostática, mareo, eyaculación retrógrada, congestión nasal, síndrome del iris flácido intraoperatorio.',
    contraindicaciones: 'Hipotensión ortostática severa, insuficiencia hepática severa.',
    precauciones_adulto_mayor: 'Vigilar caídas las primeras semanas. Advertir al oftalmólogo antes de cirugía de catarata.',
    interacciones: 'PDE5 (sildenafil, tadalafilo): hipotensión. Otros antihipertensivos. Inhibidores CYP3A4.',
    conservacion: 'Temperatura ambiente.',
  },

  TIAMAZOL: {
    categoria: 'Antitiroideo.',
    indicaciones: 'Hipertiroidismo (enfermedad de Graves), preparación para tratamiento definitivo.',
    posologia: 'Adultos: inicio 15–30 mg/día, mantención 5–10 mg/día.',
    efectos_adversos: 'Rash, prurito, agranulocitosis (rara pero grave: fiebre, dolor de garganta → consultar urgente), hepatitis.',
    contraindicaciones: 'Embarazo (1er trimestre, preferir propiltiouracilo), agranulocitosis previa.',
    precauciones_adulto_mayor: 'Hemograma y pruebas hepáticas antes de iniciar. Suspender ante fiebre o dolor de garganta y consultar urgente.',
    interacciones: 'Anticoagulantes, digoxina, betabloqueantes (ajuste al normalizar tiroides).',
    conservacion: 'Temperatura ambiente.',
  },

  DILTIAZEM: {
    categoria: 'Antagonista de canales de calcio (no dihidropiridina).',
    indicaciones: 'Hipertensión, angina, control de frecuencia en fibrilación auricular.',
    posologia: 'Adultos: 120–360 mg/día. Presentaciones de liberación prolongada en 1 toma.',
    efectos_adversos: 'Bradicardia, edema, estreñimiento, cefalea, bloqueo AV.',
    contraindicaciones: 'Bloqueo AV 2°–3°, insuficiencia cardíaca severa, hipotensión.',
    precauciones_adulto_mayor: 'Riesgo de bradicardia (no combinar con betabloqueantes salvo indicación específica).',
    interacciones: 'Simvastatina (limitar a 10 mg), betabloqueantes, digoxina, carbamazepina, ciclosporina.',
    conservacion: 'Temperatura ambiente.',
  },

  FLUNARIZINA: {
    categoria: 'Antagonista de canales de calcio (selectivo cerebral).',
    indicaciones: 'Profilaxis de migraña, vértigo periférico.',
    posologia: 'Adultos: 5–10 mg en la noche.',
    efectos_adversos: 'Somnolencia, ganancia de peso, parkinsonismo, depresión.',
    contraindicaciones: 'Depresión, parkinsonismo previo.',
    precauciones_adulto_mayor: 'EVITAR: alto riesgo de parkinsonismo y depresión en adulto mayor.',
    interacciones: 'Depresores SNC, alcohol.',
    conservacion: 'Temperatura ambiente.',
  },

  BETAHISTINA: {
    categoria: 'Análogo de histamina con efecto vasodilatador del oído interno.',
    indicaciones: 'Vértigo, enfermedad de Ménière, tinnitus de origen vestibular.',
    posologia: 'Adultos: 8–16 mg cada 8 h con alimentos.',
    efectos_adversos: 'Náuseas, cefalea, dispepsia.',
    contraindicaciones: 'Feocromocitoma, úlcera péptica activa.',
    precauciones_adulto_mayor: 'Generalmente bien tolerado. Tomar con alimentos.',
    interacciones: 'Antihistamínicos (antagonismo teórico).',
    conservacion: 'Temperatura ambiente.',
  },
};

// ────────────────────────────────────────────────────────────────────────────
// Normalización y lookup
// ────────────────────────────────────────────────────────────────────────────

/** Quita tildes/diacríticos y normaliza espacios. */
function stripDiacritics(s: string): string {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '');
}

/** Quita tokens de dosis: "500mg", "0,5%", "100 UI", "2,5 mg/ml", etc. */
function stripDoses(s: string): string {
  // Comma decimal: "0,5"; dot decimal: "0.5"; units: mg, mcg, μg, g, ml, %, ui
  return s.replace(/\b\d+(?:[.,]\d+)?\s*(?:mg|mcg|μg|ug|g|%|ui|ml|cc|kg|mg\/ml|mg\/kg)\b/gi, '');
}

/** Aliases de nomenclatura común en Chile → clave canónica del KB. */
const ALIASES: Record<string, string> = {
  'AC ACETILSALICILICO': 'ACIDO ACETILSALICILICO',
  'ACIDO ACETIL SALICILICO': 'ACIDO ACETILSALICILICO',
  'ASPIRINA': 'ACIDO ACETILSALICILICO',
  'AAS': 'ACIDO ACETILSALICILICO',
  'AC FOLICO': 'ACIDO FOLICO',
  'AC CLAVULANICO': 'ACIDO CLAVULANICO',
  'OX ZINC': 'OXIDO DE ZINC',
  'OXIDO ZINC': 'OXIDO DE ZINC',
  'DICLOFENACO SODICO': 'DICLOFENACO',
  'DICLOFENACO POTASICO': 'DICLOFENACO',
  'DICLOFENACO DIETILAMINA': 'DICLOFENACO',
  'LOSARTAN POTASICO': 'LOSARTAN',
  'TADALAFILO': 'TADALAFILO',
  'TADALAFIL': 'TADALAFILO',
  'SILDENAFIL': 'SILDENAFIL',
  'SILDENAFILO': 'SILDENAFIL',
  'VITAMINA D': 'VITAMINA D3',
  'COLECALCIFEROL': 'VITAMINA D3',
  'VITAMINA B12': 'CIANOCOBALAMINA',
  'CIANOCOBALAMINA': 'CIANOCOBALAMINA',
  'PARGEVERINA': 'PARGEVERINA CLORHIDRATO',
  'OXOLAMINA CITRATO': 'OXOLAMINA',
};

/** Tokeniza un string de `active_ingredient` en sus componentes canónicos. */
export function tokenizeIngredients(raw: string | null | undefined): string[] {
  if (!raw) return [];
  const cleaned = stripDoses(stripDiacritics(raw.toUpperCase()))
    .replace(/[+&/]/g, ',')
    .replace(/\s+/g, ' ')
    .trim();
  const parts = cleaned
    .split(/,|\bY\b/)
    .map((p) => p.replace(/[^A-Z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim())
    .filter((p) => p.length > 2);
  // De-dup preserving order
  const seen = new Set<string>();
  const out: string[] = [];
  for (const p of parts) {
    const canon = ALIASES[p] ?? p;
    if (!seen.has(canon)) {
      seen.add(canon);
      out.push(canon);
    }
  }
  return out;
}

export interface DrugLookupResult {
  /** Nombre canónico encontrado en KB */
  name: string;
  info: DrugInfo;
}

/** Busca info para cada componente del principio activo. Devuelve los que existan en KB. */
export function lookupDrugInfo(activeIngredient: string | null | undefined): DrugLookupResult[] {
  const tokens = tokenizeIngredients(activeIngredient);
  if (tokens.length === 0) return [];

  // 1) Combinación completa (ej "PARACETAMOL + TRAMADOL")
  if (tokens.length > 1) {
    const comboKey = tokens.slice().sort().join(' + ');
    if (DRUG_INFO[comboKey]) {
      return [{ name: comboKey, info: DRUG_INFO[comboKey] }];
    }
    // También intentar orden original
    const orderedKey = tokens.join(' + ');
    if (DRUG_INFO[orderedKey]) {
      return [{ name: orderedKey, info: DRUG_INFO[orderedKey] }];
    }
  }

  // 2) Lookup por componente individual
  const results: DrugLookupResult[] = [];
  for (const token of tokens) {
    if (DRUG_INFO[token]) {
      results.push({ name: token, info: DRUG_INFO[token] });
      continue;
    }
    // Coincidencia parcial: si la clave del KB es prefijo del token o viceversa
    const partial = Object.keys(DRUG_INFO).find(
      (k) => k.split(' + ').length === 1 && (token.startsWith(k) || k.startsWith(token))
    );
    if (partial) {
      results.push({ name: partial, info: DRUG_INFO[partial] });
    }
  }
  return results;
}

/** Nombre amigable: convierte "ACIDO ACETILSALICILICO" → "Ácido acetilsalicílico". */
export function prettifyDrugName(canonical: string): string {
  return canonical
    .toLowerCase()
    .replace(/\bacido\b/g, 'ácido')
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .replace(/\+/g, ' + ');
}
