export const recantos = [
    // 1. RECANTO DO SACI-PERERÊ
    {
        id: 'saci',
        icone: '🌡️',
        titulo: 'Recanto do Saci-Pererê',
        eixoAmbiental: 'Clima & Microclima',
        descricao: 'Análise microclimática comparativa e contrato de investigação ecológica.',
        missoes: [
            {
                id: 'saci-01',
                aspecto: 'clima',
                titulo: 'Contrato do Investigador & Credenciamento',
                orientacaoCientifica: 'Alinhe as regras de campo com sua equipe de pesquisa antes de iniciar a caminhada.',
                pergunta: 'Qual a conduta ética correta ao investigar micro-organismos e a fauna no Cerrado?',
                opcoes: [
                    '🌱 Observar sem alterar o habitat, registrar evidências e não remover espécimes',
                    '🍂 Coletar plantas e insetos para levar para a sala de aula',
                    '🔊 Fazer barulho para afugentar os animais da trilha',
                    '🥾 Caminhar fora das rotas demarcadas para encontrar mais espécies'
                ],
                correta: 0,
                sucesso: 'Contrato assinado! Sua equipe obteve o credenciamento de pesquisa no ITS.',
                dica: 'A ética científica exige impacto mínimo no ecossistema investigado.',
                recursoRequerido: 'quiz'
            },
            {
                id: 'saci-02',
                aspecto: 'clima',
                titulo: 'Monitoramento Microclimático Inicial',
                orientacaoCientifica: 'Registre a temperatura ambiental e a sensação térmica sob o dossel florestal neste recanto.',
                pergunta: 'Como a cobertura vegetal do Cerrado afeta o microclima local?',
                opcoes: [
                    '🌡️ Reduz a radiação direta, aumentando a umidade e amenizando a temperatura',
                    '☀️ Não altera em nada os fatores abióticos locais',
                    '🌵 Aumenta a temperatura devido à retenção de calor pelas folhas',
                    '💨 Elimina completamente a umidade relativa do ar'
                ],
                correta: 0,
                sucesso: 'Dados climáticos registrados com sucesso!',
                dica: 'Analise o papel da copa das árvores no sombreamento e evapotranspiração.',
                recursoRequerido: 'medicao_clima'
            }
        ]
    },
    // 2. RECANTO DO JATOBÁ
    {
        id: 'jatoba',
        icone: '🌳',
        titulo: 'Recanto do Jatobá',
        eixoAmbiental: 'Flora & Microflora (Decompositores)',
        descricao: 'Bioblitz da serrapilheira, taxonomia vegetal e identificação de fungos decompositores.',
        missoes: [
            {
                id: 'jatoba-01',
                aspecto: 'microflora',
                titulo: 'Bioblitz de Decompositores (Fungos e Líquens)',
                orientacaoCientifica: 'Examine troncos e a serrapilheira na base do Jatobá em busca de fungos (Polyporaceae) e líquens.',
                pergunta: 'Qual a função ecológica vital dos fungos decompositores no ecossistema do Cerrado?',
                opcoes: [
                    '🍄 Reciclar a matéria orgânica morta, liberando nutrientes minerais no solo',
                    '🌿 Realizar fotossíntese para fornecer oxigênio diretamente às raízes',
                    '🕷️ Atuar exclusivamente como parasitas destruidores de árvores sadias',
                    '💧 Armazenar água potável para os animais de grande porte'
                ],
                correta: 0,
                sucesso: 'Excelente observação! A serrapilheira é o motor da ciclagem de nutrientes.',
                dica: 'Pense no ciclo da matéria e no destino das folhas caídas.',
                recursoRequerido: 'camera',
                permiteFoto: true
            },
            {
                id: 'jatoba-02',
                aspecto: 'flora',
                titulo: 'Adaptabilidade Botânica (Casca e Cortiça)',
                orientacaoCientifica: 'Analise o tronco do Jatobá e a espessura da sua casca (suberização).',
                pergunta: 'A casca espessa das árvores do Cerrado representa uma adaptação contra qual fator?',
                opcoes: [
                    '🔥 Incêndios periódicos e perda excessiva de água por transpiração',
                    '❄️ Geadas intensas durante a estação chuvosa',
                    '🐒 Ataque de mamíferos escaladores',
                    '🌊 Inundações permanentes do solo'
                ],
                correta: 0,
                sucesso: 'Análise taxonômica concluída com sucesso.',
                dica: 'Relacione a morfologia da planta com o clima estacional do bioma.',
                recursoRequerido: 'quiz'
            }
        ]
    },
    // 3. RECANTO DAS PIONEIRAS
    {
        id: 'pioneiras',
        icone: '🐝',
        titulo: 'Recanto das Pioneiras',
        eixoAmbiental: 'Fauna (Polinizadores) & Ecologia',
        descricao: 'Engenharia biológica de dispersão de sementes e mapeamento de insetos polinizadores.',
        missoes: [
            {
                id: 'pioneiras-01',
                aspecto: 'fauna',
                titulo: 'Desafio STEM: Aerodinâmica da Dispersão Anemocórica',
                orientacaoCientifica: 'Construa um protótipo de semente winged/alada com elementos caídos e teste seu tempo de queda.',
                recursoRequerido: 'cronometro'
            },
            {
                id: 'pioneiras-02',
                aspecto: 'microfauna',
                titulo: 'Mapeamento de Insetos Polinizadores',
                orientacaoCientifica: 'Procure espécimes de Hymenoptera (abelhas) ou Lepidoptera (borboletas) nas inflorescências.',
                pergunta: 'Como a relação mutualista entre plantas pioneiras e polinizadores acelera a regeneração ambiental?',
                opcoes: [
                    '🌸 Garante o fluxo gênico e a formação de frutos/sementes em áreas degradadas',
                    '🐜 Apenas alimenta os insetos sem beneficiar a reprodução vegetal',
                    '🍂 Impede que outras espécies de plantas cresçam no local',
                    '☀️ Aumenta a captação de luz solar pelas pétalas'
                ],
                correta: 0,
                sucesso: 'Hipótese gravada e evidência ecológica catalogada!',
                dica: 'Lembre-se da importância do transporte de pólen para a variabilidade genética.',
                recursoRequerido: 'audio',
                permiteAudio: true
            }
        ]
    },
    // 4. RECANTO DO CAIPORA
    {
        id: 'caipora',
        icone: '🎧',
        titulo: 'Recanto do Caipora',
        eixoAmbiental: 'Microfauna (Bioacústica) & Sensoriamento',
        descricao: 'Paisagem sonora, bioacústica de insetos (estridulação) e avifauna.',
        missoes: [
            {
                id: 'caipora-01',
                aspecto: 'microfauna',
                titulo: 'Análise de Paisagem Sonora (Bioacústica)',
                orientacaoCientifica: 'Ative o protocolo de escuta passiva de 45 segundos e isole frequências sonoras de microfauna (Gryllidae/Cicadidae).',
                pergunta: 'Por que a intensidade e diversidade de sons de insetos serve como indicador de qualidade ambiental?',
                opcoes: [
                    '🦗 Reflete a complexidade da teia alimentar e a integridade do habitat',
                    '📢 Indica que o ambiente está poluído e os animais estão estressados',
                    '🔊 Mostra que não existem predadores vertebrados na região',
                    '🍃 Demonstra que a vegetação está seca e morrendo'
                ],
                correta: 0,
                sucesso: 'Checklist auditivo de bioacústica enviado.',
                dica: 'Considere a bioacústica como uma ferramenta moderna de monitoramento ecológico não invasivo.',
                recursoRequerido: 'quiz'
            }
        ]
    },
    // 5. RECANTO DO NEGO D'ÁGUA
    {
        id: 'nego-dagua',
        icone: '🌊',
        titulo: "Recanto do Nego D'Água",
        eixoAmbiental: 'Água, Veredas & Macrofauna',
        descricao: 'Hidrologia de veredas, macroinvertebrados aquáticos (bioindicadores) e rastreamento de fauna.',
        missoes: [
            {
                id: 'nego-01',
                aspecto: 'agua',
                titulo: 'Mapeamento Hidrológico e Vereda de Pindaibais',
                orientacaoCientifica: 'Fotografe o curso d’água sob a ponte e desenhe a linha do vetor de fluxo hídrico.',
                recursoRequerido: 'desenho',
                permiteFoto: true,
                permiteDesenho: true
            },
            {
                id: 'nego-02',
                aspecto: 'agua',
                titulo: 'Macroinvertebrados como Bioindicadores de Qualidade da Água',
                orientacaoCientifica: 'Procure larvas de Odonata (libélulas) ou Hemiptera (Alfaiates) na lâmina d’água.',
                pergunta: 'A presença de ninfas de libélula na água indica qual condição ambiental?',
                opcoes: [
                    '💧 Boa qualidade da água e baixos níveis de poluição orgânica',
                    '☣️ Água altamente contaminada por produtos químicos',
                    '🧪 Ausência completa de oxigênio dissolvido',
                    '🛑 Ambiente impróprio para qualquer vida aquática'
                ],
                correta: 0,
                sucesso: 'Bioindicador identificado! Registro enviado para o banco de Ciência Cidadã.',
                dica: 'Sensibilidade de organismos aquáticos a poluentes determina sua presença/ausência.',
                recursoRequerido: 'camera',
                permiteFoto: true
            }
        ]
    }
];
