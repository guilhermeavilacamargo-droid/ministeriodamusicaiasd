"use client";

import React, { useState, useMemo, useEffect } from "react";

// ==========================================
// TIPOS E ESTRUTURAS DE DADOS
// ==========================================
type TabType = "escala" | "musicos" | "grupos" | "mensagens";
type TipoProgramacao = "sabado" | "outro";

export type InstrumentoTipo =
  | "Piano"
  | "Bateria"
  | "Guitarra"
  | "Baixo"
  | "Violão"
  | "Violino";

interface Musico {
  id: string;
  nome: string;
  instrumentos: InstrumentoTipo[];
  telefone: string;
}

interface GrupoLouvor {
  id: string;
  nome: string;
  integrantes: string;
}

interface Culto {
  id: string;
  data: string; // YYYY-MM-DD
  tipoProgramacao: TipoProgramacao; // "sabado" (Escola Sabatina + Culto) ou "outro" (Lista única)
  titulo: string;
  ehEspecial: boolean;
  textoEspecial: string;
  pregador: string;
  grupoLouvorId: string;
  louvorAvulso: string;
  bandaIds: string[];
  mmNome: string;
  mmTelefone: string;
  mmQtdMusicas: number;
  musicasEscolaSabatina: string[];
  musicasCulto: string[];
  musicasGeral: string[]; // Usado quando tipoProgramacao === "outro"
}

interface AvisoMural {
  id: string;
  titulo: string;
  texto: string;
}

// ==========================================
// COMPONENTE DA LOGO (/public/logo_iasd)
// Detecta automaticamente .png, .svg, .jpg, .jpeg, .webp
// ==========================================
const EXTENSOES_LOGO = [".png", ".svg", ".jpg", ".jpeg", ".webp", ""];

function LogoIASD({ tamanho = "w-7 h-7" }: { tamanho?: string }) {
  const [indiceExt, setIndiceExt] = useState(0);

  const srcAtual = `./logo_iasd${EXTENSOES_LOGO[indiceExt]}`;

  return (
    <img
      src={srcAtual}
      alt="Logo IASD"
      className={`${tamanho} object-contain`}
      onError={() => {
        if (indiceExt < EXTENSOES_LOGO.length - 1) {
          setIndiceExt((prev) => prev + 1);
        }
      }}
    />
  );
}

// ==========================================
// HOOK DE MEMÓRIA PERMANENTE SILENCIOSO
// ==========================================
function usePersistentState<T>(
  chave: string,
  valorInicial: T
): [T, React.Dispatch<React.SetStateAction<T>>, boolean] {
  const [estado, setEstado] = useState<T>(valorInicial);
  const [inicializado, setInicializado] = useState(false);

  useEffect(() => {
    try {
      const itemSalvo = window.localStorage.getItem(chave);
      if (itemSalvo !== null) {
        setEstado(JSON.parse(itemSalvo));
      }
    } catch (erro) {
      console.error(`Erro ao ler ${chave}:`, erro);
    } finally {
      setInicializado(true);
    }
  }, [chave]);

  useEffect(() => {
    if (!inicializado) return;
    try {
      window.localStorage.setItem(chave, JSON.stringify(estado));
    } catch (erro) {
      console.error(`Erro ao salvar ${chave}:`, erro);
    }
  }, [chave, estado, inicializado]);

  return [estado, setEstado, inicializado];
}

// ==========================================
// CORES E ORDEM DOS 6 INSTRUMENTOS
// ==========================================
const INSTRUMENTOS_CONFIG: Record<
  InstrumentoTipo,
  { ordem: number; bg: string; text: string; dot: string; border: string }
> = {
  Piano: {
    ordem: 1,
    bg: "bg-blue-50",
    text: "text-blue-700",
    dot: "bg-blue-500",
    border: "border-blue-200/80",
  },
  Bateria: {
    ordem: 2,
    bg: "bg-stone-100",
    text: "text-stone-700",
    dot: "bg-stone-500",
    border: "border-stone-300/80",
  },
  Guitarra: {
    ordem: 3,
    bg: "bg-indigo-50",
    text: "text-indigo-700",
    dot: "bg-indigo-500",
    border: "border-indigo-200/80",
  },
  Baixo: {
    ordem: 4,
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    dot: "bg-emerald-500",
    border: "border-emerald-200/80",
  },
  Violão: {
    ordem: 5,
    bg: "bg-amber-50",
    text: "text-amber-800",
    dot: "bg-amber-500",
    border: "border-amber-200/80",
  },
  Violino: {
    ordem: 6,
    bg: "bg-rose-50",
    text: "text-rose-700",
    dot: "bg-rose-500",
    border: "border-rose-200/80",
  },
};

const LISTA_INSTRUMENTOS = Object.keys(INSTRUMENTOS_CONFIG) as InstrumentoTipo[];

export default function SistemaMusicaIASDRiachoGrande() {
  // ==========================================
  // ESTADOS GERAIS E DE IDENTIFICAÇÃO DE ENTRADA
  // ==========================================
  const [abaAtiva, setAbaAtiva, abaPronta] = usePersistentState<TabType>(
    "iasd_rg_v4_aba",
    "escala"
  );
  const [usuarioAtual, setUsuarioAtual, usuarioPronto] =
    usePersistentState<string>("iasd_rg_v4_usuario", "");

  const [opcaoLogin, setOpcaoLogin] = useState<
    "Guilherme" | "Arthur" | "Júlia" | "Outro" | ""
  >("");
  const [outroNomeInput, setOutroNomeInput] = useState("");
  const [forcarBannerUsuario, setForcarBannerUsuario] = useState(false);

  // Filtro de Instrumentos na aba Músicos
  const [menuFiltroAberto, setMenuFiltroAberto] = useState(false);
  const [instrumentoFiltro, setInstrumentoFiltro] = useState<
    InstrumentoTipo | "Todos"
  >("Todos");

  // Culto selecionado para gerar mensagem no WhatsApp
  const [cultoWhatsappId, setCultoWhatsappId] = useState<string>("");

  // Rascunhos de novas músicas por culto (chave: cultoId_tipo)
  const [rascunhoMusica, setRascunhoMusica] = useState<Record<string, string>>(
    {}
  );

  // Data atual calculada no cliente (Next.js 16)
  const [hojeISO, setHojeISO] = useState<string>("");

  useEffect(() => {
    const d = new Date();
    const ano = d.getFullYear();
    const mes = String(d.getMonth() + 1).padStart(2, "0");
    const dia = String(d.getDate()).padStart(2, "0");
    setHojeISO(`${ano}-${mes}-${dia}`);
  }, []);

  // ==========================================
  // DADOS COM SALVAMENTO AUTOMÁTICO
  // ==========================================
  const [musicos, setMusicos, musicosProntos] = usePersistentState<Musico[]>(
    "iasd_rg_v4_musicos",
    [
      {
        id: "m1",
        nome: "Guilherme Ávila",
        instrumentos: ["Piano"],
        telefone: "(11) 99876-5432",
      },
      {
        id: "m2",
        nome: "Arthur",
        instrumentos: ["Guitarra", "Violão"],
        telefone: "(11) 99123-4567",
      },
      {
        id: "m3",
        nome: "Lucas Silveira",
        instrumentos: ["Baixo", "Violão"],
        telefone: "(11) 99333-2211",
      },
      {
        id: "m4",
        nome: "Henrique Costa",
        instrumentos: ["Violino"],
        telefone: "(11) 99777-8899",
      },
    ]
  );

  const [grupos, setGrupos, gruposProntos] = usePersistentState<GrupoLouvor[]>(
    "iasd_rg_v4_grupos",
    [
      {
        id: "g1",
        nome: "Grupo Harmonia Celeste",
        integrantes: "Priscila, Marcos, Júlia, Pedro",
      },
      {
        id: "g2",
        nome: "Vozes da Esperança",
        integrantes: "Lucas, Beatriz, Rafael, Camila",
      },
      {
        id: "g3",
        nome: "Grupo Jovem Adoradores",
        integrantes: "Guilherme, Thaís, Matheus, Larissa",
      },
    ]
  );

  const [cultos, setCultos, cultosProntos] = usePersistentState<Culto[]>(
    "iasd_rg_v4_cultos",
    [
      {
        id: "c1",
        data: "2026-10-24",
        tipoProgramacao: "sabado",
        titulo: "Culto de Sábado",
        ehEspecial: false,
        textoEspecial: "",
        pregador: "Pr. Roberto Carlos",
        grupoLouvorId: "g1",
        louvorAvulso: "",
        bandaIds: ["m1", "m3"],
        mmNome: "Quarteto Sião",
        mmTelefone: "(11) 98888-1111",
        mmQtdMusicas: 1,
        musicasEscolaSabatina: [
          "10 - Cristãos, Despertai",
          "215 - Remido",
        ],
        musicasCulto: [
          "12 - Vinde, Povo do Senhor",
          "34 - Quão Grande És Tu",
          "46 - Dia de Chuva",
        ],
        musicasGeral: [],
      },
      {
        id: "c2",
        data: "2026-10-31",
        tipoProgramacao: "sabado",
        titulo: "Culto de Sábado",
        ehEspecial: true,
        textoEspecial: "Santa Ceia",
        pregador: "Anc. Fernando Silva",
        grupoLouvorId: "g2",
        louvorAvulso: "",
        bandaIds: ["m2", "m4"],
        mmNome: "Dueto Ana & Thaís",
        mmTelefone: "(11) 97777-2222",
        mmQtdMusicas: 2,
        musicasEscolaSabatina: ["73 - Rei dos Reis"],
        musicasCulto: ["71 - Santo, Santo, Santo", "262 - Ao Olhar Pra Cruz"],
        musicasGeral: [],
      },
      {
        id: "c3",
        data: "2026-11-04",
        tipoProgramacao: "outro",
        titulo: "Quarta-feira Especial",
        ehEspecial: true,
        textoEspecial: "Semana de Oração Jovem",
        pregador: "Convidado da Associação",
        grupoLouvorId: "",
        louvorAvulso: "Júlia, Arthur e Thaís",
        bandaIds: ["m1"],
        mmNome: "Solo Mariana",
        mmTelefone: "(11) 96666-3333",
        mmQtdMusicas: 1,
        musicasEscolaSabatina: [],
        musicasCulto: [],
        musicasGeral: ["Brilhar por Ti", "Maranata"],
      },
    ]
  );

  const [avisos, setAvisos, avisosProntos] = usePersistentState<AvisoMural[]>(
    "iasd_rg_v4_avisos",
    [
      {
        id: "a1",
        titulo: "Horário de Ensaio",
        texto:
          "Todos os músicos da banda e grupo de louvor devem estar na igreja às 08h45 aos sábados.",
      },
      {
        id: "a2",
        titulo: "Compromissos",
        texto:
          "As músicas do próximo culto devem ser enviadas até o domingo que anterior",
      },
    ]
  );

  // Estados dos Modais
  const [modalCultoAberto, setModalCultoAberto] = useState(false);
  const [modalMusicoAberto, setModalMusicoAberto] = useState(false);
  const [modalGrupoAberto, setModalGrupoAberto] = useState(false);
  const [modalAvisoAberto, setModalAvisoAberto] = useState(false);

  // Campos de Formulário: Novo Culto
  const [novoTipoProg, setNovoTipoProg] = useState<TipoProgramacao>("sabado");
  const [novaData, setNovaData] = useState("");
  const [novoTitulo, setNovoTitulo] = useState("Culto de Sábado");
  const [novoEspecial, setNovoEspecial] = useState(false);
  const [novoTextoEspecial, setNovoTextoEspecial] = useState("");
  const [novoPregador, setNovoPregador] = useState("");

  // Campos de Formulário: Novo Músico
  const [novoMusicoNome, setNovoMusicoNome] = useState("");
  const [novoMusicoTel, setNovoMusicoTel] = useState("");
  const [novoMusicoInsts, setNovoMusicoInsts] = useState<InstrumentoTipo[]>([
    "Piano",
  ]);

  // Campos de Formulário: Novo Grupo
  const [novoGrupoNome, setNovoGrupoNome] = useState("");
  const [novoGrupoIntegrantes, setNovoGrupoIntegrantes] = useState("");

  // Campos de Formulário: Novo Aviso
  const [novoAvisoTitulo, setNovoAvisoTitulo] = useState("");
  const [novoAvisoTexto, setNovoAvisoTexto] = useState("");

  // ==========================================
  // ORDENAÇÕES E SELEÇÕES
  // ==========================================
  const cultosOrdenados = useMemo(
    () => [...cultos].sort((a, b) => a.data.localeCompare(b.data)),
    [cultos]
  );

  const proximoCulto = useMemo(() => {
    if (!hojeISO) return cultosOrdenados[0] || null;
    const futuros = cultosOrdenados.filter((c) => c.data >= hojeISO);
    return futuros.length > 0 ? futuros[0] : cultosOrdenados[0] || null;
  }, [cultosOrdenados, hojeISO]);

  const outrosCultos = useMemo(() => {
    if (!proximoCulto) return [];
    return cultosOrdenados.filter((c) => c.id !== proximoCulto.id);
  }, [cultosOrdenados, proximoCulto]);

  // Define o culto padrão no seletor do WhatsApp
  useEffect(() => {
    if (!cultoWhatsappId && proximoCulto) {
      setCultoWhatsappId(proximoCulto.id);
    } else if (
      cultoWhatsappId &&
      !cultos.some((c) => c.id === cultoWhatsappId)
    ) {
      setCultoWhatsappId(proximoCulto?.id || "");
    }
  }, [proximoCulto, cultos, cultoWhatsappId]);

  const musicosFiltradosEOrdenados = useMemo(() => {
    const base =
      instrumentoFiltro === "Todos"
        ? musicos
        : musicos.filter((m) => m.instrumentos.includes(instrumentoFiltro));

    return [...base].sort((a, b) => {
      const instA = a.instrumentos[0]
        ? INSTRUMENTOS_CONFIG[a.instrumentos[0]]?.ordem ?? 99
        : 99;
      const instB = b.instrumentos[0]
        ? INSTRUMENTOS_CONFIG[b.instrumentos[0]]?.ordem ?? 99
        : 99;
      if (instA !== instB) return instA - instB;
      return a.nome.localeCompare(b.nome);
    });
  }, [musicos, instrumentoFiltro]);

  // ==========================================
  // FUNÇÕES AUXILIARES
  // ==========================================
  const formatarDataHumana = (dataStr: string) => {
    if (!dataStr) return "";
    const [ano, mes, dia] = dataStr.split("-");
    const meses = [
      "Jan",
      "Fev",
      "Mar",
      "Abr",
      "Mai",
      "Jun",
      "Jul",
      "Ago",
      "Set",
      "Out",
      "Nov",
      "Dez",
    ];
    const indiceMes = parseInt(mes, 10) - 1;
    return `${dia} de ${meses[indiceMes] || mes}, ${ano}`;
  };

  const formatarDataCurta = (dataStr: string) => {
    if (!dataStr) return "";
    const [ano, mes, dia] = dataStr.split("-");
    return `${dia}/${mes}/${ano}`;
  };

  const verificarRepeticaoGrupo = (
    cultoId: string,
    grupoId: string
  ): boolean => {
    if (!grupoId) return false;
    const idx = cultosOrdenados.findIndex((c) => c.id === cultoId);
    if (idx <= 0) return false;
    return cultosOrdenados[idx - 1].grupoLouvorId === grupoId;
  };

  const verificarRepeticaoMusicoBanda = (
    cultoId: string,
    musicoId: string
  ): boolean => {
    const idx = cultosOrdenados.findIndex((c) => c.id === cultoId);
    if (idx <= 0) return false;
    return cultosOrdenados[idx - 1].bandaIds.includes(musicoId);
  };

  const atualizarCulto = (
    cultoId: string,
    campo: keyof Culto,
    valor: string | number | boolean | string[]
  ) => {
    setCultos((prev) =>
      prev.map((c) => (c.id === cultoId ? { ...c, [campo]: valor } : c))
    );
  };

  const adicionarMusicoNaBanda = (cultoId: string, musicoId: string) => {
    if (!musicoId) return;
    setCultos((prev) =>
      prev.map((c) => {
        if (c.id !== cultoId || c.bandaIds.includes(musicoId)) return c;
        return { ...c, bandaIds: [...c.bandaIds, musicoId] };
      })
    );
  };

  const removerMusicoDaBanda = (cultoId: string, musicoId: string) => {
    setCultos((prev) =>
      prev.map((c) =>
        c.id === cultoId
          ? { ...c, bandaIds: c.bandaIds.filter((id) => id !== musicoId) }
          : c
      )
    );
  };

  // Funções para adicionar e apagar músicas do dia
  const adicionarMusicaNoCulto = (
    cultoId: string,
    secao: "musicasEscolaSabatina" | "musicasCulto" | "musicasGeral",
    chaveInput: string
  ) => {
    const texto = (rascunhoMusica[chaveInput] || "").trim();
    if (!texto) return;

    setCultos((prev) =>
      prev.map((c) => {
        if (c.id !== cultoId) return c;
        const listaAtual = c[secao] || [];
        return { ...c, [secao]: [...listaAtual, texto] };
      })
    );

    setRascunhoMusica((prev) => ({ ...prev, [chaveInput]: "" }));
  };

  const removerMusicaDoCulto = (
    cultoId: string,
    secao: "musicasEscolaSabatina" | "musicasCulto" | "musicasGeral",
    indice: number
  ) => {
    setCultos((prev) =>
      prev.map((c) => {
        if (c.id !== cultoId) return c;
        const listaAtual = c[secao] || [];
        return {
          ...c,
          [secao]: listaAtual.filter((_, idx) => idx !== indice),
        };
      })
    );
  };

  const excluirCulto = (id: string) => {
    setCultos((prev) => prev.filter((c) => c.id !== id));
  };

  const excluirMusico = (id: string) => {
    setMusicos((prev) => prev.filter((m) => m.id !== id));
  };

  const excluirGrupo = (id: string) => {
    setGrupos((prev) => prev.filter((g) => g.id !== id));
  };

  const excluirAviso = (id: string) => {
    setAvisos((prev) => prev.filter((a) => a.id !== id));
  };

  const alternarInstrumentoNoForm = (inst: InstrumentoTipo) => {
    setNovoMusicoInsts((prev) => {
      if (prev.includes(inst)) {
        return prev.length > 1 ? prev.filter((i) => i !== inst) : prev;
      }
      return [...prev, inst].sort(
        (a, b) => INSTRUMENTOS_CONFIG[a].ordem - INSTRUMENTOS_CONFIG[b].ordem
      );
    });
  };

  const confirmarIdentificacao = (e: React.FormEvent) => {
    e.preventDefault();
    if (opcaoLogin === "Outro") {
      if (!outroNomeInput.trim()) return;
      setUsuarioAtual(outroNomeInput.trim());
    } else if (opcaoLogin) {
      setUsuarioAtual(opcaoLogin);
    }
    setForcarBannerUsuario(false);
  };

  // ==========================================
  // GERADOR DO TEXTO DO WHATSAPP (SEM EMOJIS)
  // ==========================================
  const textoWhatsappGerado = useMemo(() => {
    const c =
      cultosOrdenados.find((item) => item.id === cultoWhatsappId) ||
      proximoCulto;
    if (!c) return "Nenhum culto selecionado.";

    const grupoObj = grupos.find((g) => g.id === c.grupoLouvorId);
    const nomesDoGrupo = grupoObj ? grupoObj.integrantes || grupoObj.nome : "";
    const nomesLouvor =
      nomesDoGrupo && c.louvorAvulso
        ? `${nomesDoGrupo}, ${c.louvorAvulso}`
        : nomesDoGrupo || c.louvorAvulso || "A definir";

    const nomesMusicos =
      c.bandaIds
        .map((id) => musicos.find((m) => m.id === id)?.nome)
        .filter(Boolean)
        .join(", ") || "A definir";

    const nomeMensagemMusical = c.mmNome || "A definir";

    const tipo = c.tipoProgramacao || "sabado";

    if (tipo === "sabado") {
      const listaES =
        c.musicasEscolaSabatina && c.musicasEscolaSabatina.length > 0
          ? c.musicasEscolaSabatina.map((m) => `- ${m}`).join("\n")
          : "- A definir";

      const listaCultoEscolhidas =
        c.musicasCulto && c.musicasCulto.length > 0
          ? c.musicasCulto.map((m) => `- ${m}`).join("\n") + "\n"
          : "";

      return (
        `*Programação do dia ${formatarDataCurta(c.data)}:*\n\n` +
        `Pregador: ${c.pregador || "A definir"}\n` +
        `Grupo de louvor: ${nomesLouvor}\n` +
        `Músicos: ${nomesMusicos}\n` +
        `Mensagem musical: ${nomeMensagemMusical}\n\n` +
        `Músicas:\n` +
        `Escola Sabatina:\n` +
        `${listaES}\n` +
        `Culto:\n` +
        `- Maravilhoso Senhor\n` +
        `${listaCultoEscolhidas}` +
        `- Deus nos Ouvirá\n` +
        `- Em Paz eu Vou\n\n` +
        `Para a banda:\n` +
        `- 2 músicas para dízimos e ofertas (1 na Escola Sabatina e 1 no Culto)\n` +
        `- 587 - Chegou a Hora de Adorar ao Senhor (Momento das Crianças)`
      );
    } else {
      // Estrutura para programação de outro dia / evento especial (sem Escola Sabatina)
      const listaGeral =
        c.musicasGeral && c.musicasGeral.length > 0
          ? c.musicasGeral.map((m) => `- ${m}`).join("\n")
          : "- A definir";

      return (
        `*Programação do dia ${formatarDataCurta(c.data)} (${c.textoEspecial || c.titulo}):*\n\n` +
        `Pregador: ${c.pregador || "A definir"}\n` +
        `Grupo de louvor: ${nomesLouvor}\n` +
        `Músicos: ${nomesMusicos}\n` +
        `Mensagem musical: ${nomeMensagemMusical}\n\n` +
        `Músicas:\n` +
        `${listaGeral}`
      );
    }
  }, [cultosOrdenados, cultoWhatsappId, proximoCulto, grupos, musicos]);

  const sistemaCarregado =
    abaPronta &&
    usuarioPronto &&
    musicosProntos &&
    gruposProntos &&
    cultosProntos &&
    avisosProntos &&
    Boolean(hojeISO);

  const mostrarBannerEntrada = !usuarioAtual || forcarBannerUsuario;

  // ==========================================
  // RENDERIZAÇÃO DOS CAMPOS E MÚSICAS DO CULTO
  // ==========================================
  const renderizarCamposCulto = (culto: Culto) => {
    const repGrupo = verificarRepeticaoGrupo(culto.id, culto.grupoLouvorId);
    const ehSabado = (culto.tipoProgramacao || "sabado") === "sabado";

    const chaveInputES = `${culto.id}_es`;
    const chaveInputCulto = `${culto.id}_culto`;
    const chaveInputGeral = `${culto.id}_geral`;

    return (
      <div className="space-y-6 pt-5">
        {/* LINHA HORIZONTAL PRINCIPAL: 1. Pregador | 2. Grupo de Louvor | 3. Banda | 4. Mensagem Musical */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* 1. PREGADOR */}
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#86868B] mb-1.5">
              1. Pregador(a)
            </label>
            <input
              type="text"
              value={culto.pregador}
              onChange={(e) =>
                atualizarCulto(culto.id, "pregador", e.target.value)
              }
              placeholder="Nome do pregador"
              className="w-full bg-[#F5F5F7] focus:bg-white border border-transparent focus:border-[#0071E3] rounded-xl px-3.5 py-2.5 text-sm font-medium text-[#1D1D1F] outline-none transition"
            />
          </div>

          {/* 2. GRUPO DE LOUVOR (SOMENTE GRUPOS EXISTENTES NO SELECT + CAMPO AVULSO ABAIXO) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-[#86868B]">
                2. Grupo de Louvor
              </label>
              {repGrupo && (
                <span className="text-[10px] font-semibold bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full">
                  Repetido do anterior
                </span>
              )}
            </div>

            <select
              value={
                culto.grupoLouvorId === "avulso" ? "" : culto.grupoLouvorId
              }
              onChange={(e) =>
                atualizarCulto(culto.id, "grupoLouvorId", e.target.value)
              }
              className={`w-full rounded-xl px-3.5 py-2.5 text-sm font-medium outline-none transition ${
                repGrupo
                  ? "bg-amber-50 border border-amber-300 text-amber-900"
                  : "bg-[#F5F5F7] focus:bg-white border border-transparent focus:border-[#0071E3] text-[#1D1D1F]"
              }`}
            >
              <option value="">Selecionar grupo...</option>
              {grupos.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.nome}
                </option>
              ))}
            </select>

            <input
              type="text"
              value={culto.louvorAvulso || ""}
              onChange={(e) =>
                atualizarCulto(culto.id, "louvorAvulso", e.target.value)
              }
              placeholder="Adicionar nomes avulsos..."
              className="w-full bg-[#F5F5F7] focus:bg-white border border-transparent focus:border-[#0071E3] rounded-xl px-3.5 py-2 text-xs font-medium text-[#1D1D1F] outline-none transition"
            />
          </div>

          {/* 3. BANDA */}
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#86868B] mb-1.5">
              3. Banda
            </label>
            <div className="space-y-2">
              {culto.bandaIds.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {culto.bandaIds.map((mId) => {
                    const musico = musicos.find((m) => m.id === mId);
                    if (!musico) return null;
                    const repetido = verificarRepeticaoMusicoBanda(
                      culto.id,
                      mId
                    );
                    return (
                      <span
                        key={mId}
                        className={`inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-xl ${
                          repetido
                            ? "bg-amber-50 text-amber-900 border border-amber-300"
                            : "bg-[#F5F5F7] text-[#1D1D1F]"
                        }`}
                      >
                        <span>
                          {musico.nome} ({musico.instrumentos[0]})
                          {repetido && " ⚠️"}
                        </span>
                        <button
                          type="button"
                          onClick={() => removerMusicoDaBanda(culto.id, mId)}
                          className="text-[#86868B] hover:text-[#FF3B30] ml-1 font-bold cursor-pointer"
                        >
                          ×
                        </button>
                      </span>
                    );
                  })}
                </div>
              )}

              <select
                value=""
                onChange={(e) =>
                  adicionarMusicoNaBanda(culto.id, e.target.value)
                }
                className="w-full bg-[#F5F5F7] focus:bg-white border border-transparent focus:border-[#0071E3] rounded-xl px-3.5 py-2.5 text-sm font-medium text-[#1D1D1F] outline-none transition"
              >
                <option value="">+ Escalar músico na banda...</option>
                {musicos
                  .filter((m) => !culto.bandaIds.includes(m.id))
                  .map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.nome} — {m.instrumentos.join(", ")}
                    </option>
                  ))}
              </select>
            </div>
          </div>

          {/* 4. MENSAGEM MUSICAL */}
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#86868B] mb-1.5">
              4. Mensagem Musical
            </label>
            <div className="space-y-2">
              <input
                type="text"
                value={culto.mmNome}
                onChange={(e) =>
                  atualizarCulto(culto.id, "mmNome", e.target.value)
                }
                placeholder="Nome (Cantor / Grupo)"
                className="w-full bg-[#F5F5F7] focus:bg-white border border-transparent focus:border-[#0071E3] rounded-xl px-3.5 py-2 text-sm font-medium text-[#1D1D1F] outline-none transition"
              />
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  value={culto.mmTelefone}
                  onChange={(e) =>
                    atualizarCulto(culto.id, "mmTelefone", e.target.value)
                  }
                  placeholder="Telefone"
                  className="w-full bg-[#F5F5F7] focus:bg-white border border-transparent focus:border-[#0071E3] rounded-xl px-3 py-2 text-xs font-medium text-[#1D1D1F] outline-none transition"
                />
                <select
                  value={culto.mmQtdMusicas}
                  onChange={(e) =>
                    atualizarCulto(
                      culto.id,
                      "mmQtdMusicas",
                      parseInt(e.target.value, 10)
                    )
                  }
                  className="w-full bg-[#F5F5F7] focus:bg-white border border-transparent focus:border-[#0071E3] rounded-xl px-3 py-2 text-xs font-medium text-[#1D1D1F] outline-none transition"
                >
                  <option value={1}>1 música</option>
                  <option value={2}>2 músicas</option>
                  <option value={3}>3 músicas</option>
                  <option value={4}>4+ músicas</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* SEÇÃO DE MÚSICAS DO DIA */}
        <div className="pt-4 border-t border-[#F5F5F7]">
          <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#86868B] mb-3">
            Músicas do Dia
          </label>

          {ehSabado ? (
            /* ESTRUTURA DE SÁBADO: SEPARADA EM ESCOLA SABATINA E CULTO */
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Escola Sabatina */}
              <div className="bg-[#F5F5F7]/70 rounded-2xl p-4 space-y-3 border border-black/[0.03]">
                <span className="text-xs font-semibold text-[#1D1D1F] block">
                  Escola Sabatina
                </span>

                {(culto.musicasEscolaSabatina || []).length > 0 && (
                  <ul className="space-y-1.5">
                    {(culto.musicasEscolaSabatina || []).map((musica, idx) => (
                      <li
                        key={idx}
                        className="flex items-center justify-between bg-white px-3 py-2 rounded-xl text-xs font-medium text-[#1D1D1F] border border-black/[0.04]"
                      >
                        <span>- {musica}</span>
                        <button
                          type="button"
                          onClick={() =>
                            removerMusicaDoCulto(
                              culto.id,
                              "musicasEscolaSabatina",
                              idx
                            )
                          }
                          className="text-[#86868B] hover:text-[#FF3B30] text-[11px] font-medium ml-2 cursor-pointer"
                        >
                          Apagar
                        </button>
                      </li>
                    ))}
                  </ul>
                )}

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={rascunhoMusica[chaveInputES] || ""}
                    onChange={(e) =>
                      setRascunhoMusica((prev) => ({
                        ...prev,
                        [chaveInputES]: e.target.value,
                      }))
                    }
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        adicionarMusicaNoCulto(
                          culto.id,
                          "musicasEscolaSabatina",
                          chaveInputES
                        );
                      }
                    }}
                    placeholder="Digite o título da música..."
                    className="flex-1 bg-white rounded-xl px-3 py-2 text-xs text-[#1D1D1F] border border-black/[0.06] focus:border-[#0071E3] outline-none"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      adicionarMusicaNoCulto(
                        culto.id,
                        "musicasEscolaSabatina",
                        chaveInputES
                      )
                    }
                    className="bg-[#0071E3] hover:bg-[#0077ED] text-white text-xs font-medium px-3.5 py-2 rounded-xl transition cursor-pointer shrink-0"
                  >
                    + Incluir música
                  </button>
                </div>
              </div>

              {/* Culto */}
              <div className="bg-[#F5F5F7]/70 rounded-2xl p-4 space-y-3 border border-black/[0.03]">
                <span className="text-xs font-semibold text-[#1D1D1F] block">
                  Culto
                </span>

                {(culto.musicasCulto || []).length > 0 && (
                  <ul className="space-y-1.5">
                    {(culto.musicasCulto || []).map((musica, idx) => (
                      <li
                        key={idx}
                        className="flex items-center justify-between bg-white px-3 py-2 rounded-xl text-xs font-medium text-[#1D1D1F] border border-black/[0.04]"
                      >
                        <span>- {musica}</span>
                        <button
                          type="button"
                          onClick={() =>
                            removerMusicaDoCulto(culto.id, "musicasCulto", idx)
                          }
                          className="text-[#86868B] hover:text-[#FF3B30] text-[11px] font-medium ml-2 cursor-pointer"
                        >
                          Apagar
                        </button>
                      </li>
                    ))}
                  </ul>
                )}

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={rascunhoMusica[chaveInputCulto] || ""}
                    onChange={(e) =>
                      setRascunhoMusica((prev) => ({
                        ...prev,
                        [chaveInputCulto]: e.target.value,
                      }))
                    }
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        adicionarMusicaNoCulto(
                          culto.id,
                          "musicasCulto",
                          chaveInputCulto
                        );
                      }
                    }}
                    placeholder="Digite o título da música..."
                    className="flex-1 bg-white rounded-xl px-3 py-2 text-xs text-[#1D1D1F] border border-black/[0.06] focus:border-[#0071E3] outline-none"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      adicionarMusicaNoCulto(
                        culto.id,
                        "musicasCulto",
                        chaveInputCulto
                      )
                    }
                    className="bg-[#0071E3] hover:bg-[#0077ED] text-white text-xs font-medium px-3.5 py-2 rounded-xl transition cursor-pointer shrink-0"
                  >
                    + Incluir música
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* ESTRUTURA DE OUTRO DIA / EVENTO ESPECIAL: SEM SEPARAÇÃO ESCOLA SABATINA E CULTO */
            <div className="bg-[#F5F5F7]/70 rounded-2xl p-4 space-y-3 border border-black/[0.03]">
              <span className="text-xs font-semibold text-[#1D1D1F] block">
                Músicas da Programação
              </span>

              {(culto.musicasGeral || []).length > 0 && (
                <ul className="space-y-1.5">
                  {(culto.musicasGeral || []).map((musica, idx) => (
                    <li
                      key={idx}
                      className="flex items-center justify-between bg-white px-3 py-2 rounded-xl text-xs font-medium text-[#1D1D1F] border border-black/[0.04]"
                    >
                      <span>- {musica}</span>
                      <button
                        type="button"
                        onClick={() =>
                          removerMusicaDoCulto(culto.id, "musicasGeral", idx)
                        }
                        className="text-[#86868B] hover:text-[#FF3B30] text-[11px] font-medium ml-2 cursor-pointer"
                      >
                        Apagar
                      </button>
                    </li>
                  ))}
                </ul>
              )}

              <div className="flex gap-2">
                <input
                  type="text"
                  value={rascunhoMusica[chaveInputGeral] || ""}
                  onChange={(e) =>
                    setRascunhoMusica((prev) => ({
                      ...prev,
                      [chaveInputGeral]: e.target.value,
                    }))
                  }
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      adicionarMusicaNoCulto(
                        culto.id,
                        "musicasGeral",
                        chaveInputGeral
                      );
                    }
                  }}
                  placeholder="Digite o título da música..."
                  className="flex-1 bg-white rounded-xl px-3 py-2 text-xs text-[#1D1D1F] border border-black/[0.06] focus:border-[#0071E3] outline-none"
                />
                <button
                  type="button"
                  onClick={() =>
                    adicionarMusicaNoCulto(
                      culto.id,
                      "musicasGeral",
                      chaveInputGeral
                    )
                  }
                  className="bg-[#0071E3] hover:bg-[#0077ED] text-white text-xs font-medium px-3.5 py-2 rounded-xl transition cursor-pointer shrink-0"
                >
                  + Incluir música
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#F5F5F7] text-[#1D1D1F] antialiased selection:bg-[#0071E3] selection:text-white">
      {/* ==========================================
          BANNER DE IDENTIFICAÇÃO ANTES DE ENTRAR
         ========================================== */}
      {mostrarBannerEntrada && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-md flex items-center justify-center p-4">
          <form
            onSubmit={confirmarIdentificacao}
            className="bg-white rounded-[28px] p-6 sm:p-8 max-w-md w-full shadow-2xl border border-black/[0.06] space-y-6"
          >
            <div className="text-center space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-white mx-auto flex items-center justify-center border border-black/[0.08] shadow-2xs">
                <LogoIASD tamanho="w-8 h-8" />
              </div>
              <h2 className="text-xl font-semibold tracking-tight text-[#1D1D1F]">
                Quem está entrando?
              </h2>
              <p className="text-xs text-[#86868B]">
                Selecione seu nome para acessar o sistema do Ministério da Música - IASD Riacho Grande.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              {(["Guilherme", "Arthur", "Júlia", "Outro"] as const).map(
                (nomeOpcao) => {
                  const selecionado = opcaoLogin === nomeOpcao;
                  return (
                    <button
                      type="button"
                      key={nomeOpcao}
                      onClick={() => setOpcaoLogin(nomeOpcao)}
                      className={`py-3 px-4 rounded-2xl text-sm font-medium border transition cursor-pointer ${
                        selecionado
                          ? "bg-[#0071E3] text-white border-[#0071E3] shadow-sm"
                          : "bg-[#F5F5F7] text-[#1D1D1F] border-transparent hover:bg-[#E8E8ED]"
                      }`}
                    >
                      {nomeOpcao}
                    </button>
                  );
                }
              )}
            </div>

            {opcaoLogin === "Outro" && (
              <div>
                <label className="block text-xs font-medium text-[#86868B] mb-1">
                  Digite seu nome
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  value={outroNomeInput}
                  onChange={(e) => setOutroNomeInput(e.target.value)}
                  placeholder="Seu nome..."
                  className="w-full bg-[#F5F5F7] rounded-xl px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#0071E3]"
                />
              </div>
            )}

            <button
              type="submit"
              disabled={
                !opcaoLogin ||
                (opcaoLogin === "Outro" && !outroNomeInput.trim())
              }
              className="w-full bg-[#1D1D1F] disabled:opacity-40 hover:bg-black text-white font-medium text-sm py-3 rounded-full transition cursor-pointer"
            >
              Continuar
            </button>
          </form>
        </div>
      )}

      {/* ==========================================
          NAVBAR ESTILO APPLE COM A IMAGEM /public/logo_iasd
         ========================================== */}
      <header className="sticky top-0 z-40 bg-white/85 backdrop-blur-xl border-b border-[#D2D2D7]/60">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16 gap-4">
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-xl bg-white flex items-center justify-center border border-black/[0.08] shadow-2xs shrink-0 overflow-hidden"
                title="Igreja Adventista do Sétimo Dia"
              >
                <LogoIASD tamanho="w-7 h-7" />
              </div>
              <span className="font-semibold text-sm sm:text-base tracking-tight text-[#1D1D1F]">
                Ministério da Música - IASD Riacho Grande
              </span>
            </div>

            <nav className="hidden lg:flex items-center bg-[#F5F5F7] p-1 rounded-full border border-black/[0.04]">
              {[
                { id: "escala", label: "Escala Geral" },
                { id: "musicos", label: "Músicos" },
                { id: "grupos", label: "Grupos de Louvor" },
                { id: "mensagens", label: "Mensagens" },
              ].map((aba) => (
                <button
                  key={aba.id}
                  onClick={() => setAbaAtiva(aba.id as TabType)}
                  className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer ${
                    abaAtiva === aba.id
                      ? "bg-white text-[#1D1D1F] shadow-sm font-semibold"
                      : "text-[#86868B] hover:text-[#1D1D1F]"
                  }`}
                >
                  {aba.label}
                </button>
              ))}
            </nav>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => setForcarBannerUsuario(true)}
                className="flex items-center gap-2 bg-[#F5F5F7] hover:bg-[#E8E8ED] text-[#1D1D1F] px-3.5 py-1.5 rounded-full text-xs font-medium border border-black/[0.05] transition cursor-pointer"
                title="Clique para trocar o usuário"
              >
                <span className="w-2 h-2 rounded-full bg-[#0071E3]" />
                <span>{usuarioAtual || "Selecionar usuário"}</span>
              </button>
            </div>
          </div>

          <div className="flex lg:hidden space-x-1 overflow-x-auto pb-2.5 pt-1">
            {[
              { id: "escala", label: "Escala Geral" },
              { id: "musicos", label: "Músicos" },
              { id: "grupos", label: "Grupos de Louvor" },
              { id: "mensagens", label: "Mensagens" },
            ].map((aba) => (
              <button
                key={aba.id}
                onClick={() => setAbaAtiva(aba.id as TabType)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-medium whitespace-nowrap ${
                  abaAtiva === aba.id
                    ? "bg-[#1D1D1F] text-white"
                    : "bg-[#F5F5F7] text-[#86868B]"
                }`}
              >
                {aba.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* ==========================================
          CONTEÚDO PRINCIPAL
         ========================================== */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
        {/* ABA 1: ESCALA GERAL */}
        {abaAtiva === "escala" && (
          <div className="space-y-10">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-[#0071E3] mb-1">
                  Planejamento
                </p>
                <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-[#1D1D1F]">
                  Escala Geral
                </h1>
              </div>

              <button
                onClick={() => setModalCultoAberto(true)}
                className="bg-[#0071E3] hover:bg-[#0077ED] text-white rounded-full px-5 py-2.5 text-xs font-medium transition shadow-sm cursor-pointer self-start sm:self-auto"
              >
                + Adicionar culto
              </button>
            </div>

            {/* PRÓXIMO CULTO */}
            {proximoCulto ? (
              <section className="space-y-3">
                <div className="bg-white rounded-[28px] p-6 sm:p-8 shadow-[0_8px_30px_rgba(0,0,0,0.04)] border border-black/[0.05]">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-[#F5F5F7]">
                    <div className="space-y-1.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="bg-[#0071E3]/10 text-[#0071E3] text-[11px] font-semibold px-3 py-1 rounded-full">
                          Próximo Culto
                        </span>
                        {proximoCulto.ehEspecial && (
                          <span className="bg-purple-50 text-purple-700 border border-purple-200/60 text-[11px] font-semibold px-3 py-1 rounded-full">
                            {proximoCulto.textoEspecial ||
                              "Programação Especial"}
                          </span>
                        )}
                      </div>
                      <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-[#1D1D1F] pt-1">
                        {formatarDataHumana(proximoCulto.data)} —{" "}
                        <span className="text-[#86868B] font-normal">
                          {proximoCulto.titulo}
                        </span>
                      </h2>
                    </div>

                    <button
                      onClick={() => excluirCulto(proximoCulto.id)}
                      className="self-start sm:self-center text-xs text-[#86868B] hover:text-[#FF3B30] hover:bg-[#FF3B30]/10 px-3 py-1.5 rounded-full transition cursor-pointer"
                    >
                      Excluir culto
                    </button>
                  </div>

                  {renderizarCamposCulto(proximoCulto)}
                </div>
              </section>
            ) : (
              <div className="bg-white rounded-[28px] p-12 text-center border border-black/[0.04]">
                <p className="text-[#86868B] text-sm">
                  Nenhum culto cadastrado no momento.
                </p>
              </div>
            )}

            {/* DEMAIS CULTOS (UM ABAIXO DO OUTRO COM DADOS NA HORIZONTAL) */}
            {outrosCultos.length > 0 && (
              <section className="space-y-4">
                <h3 className="text-lg font-semibold tracking-tight text-[#1D1D1F] px-1">
                  Próximos Sábados e Programações
                </h3>
                <div className="flex flex-col gap-6">
                  {outrosCultos.map((culto) => (
                    <div
                      key={culto.id}
                      className="bg-white rounded-[28px] p-6 shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-black/[0.04]"
                    >
                      <div className="flex items-start justify-between gap-2 pb-4 border-b border-[#F5F5F7]">
                        <div>
                          <div className="flex flex-wrap items-center gap-2 mb-1">
                            <span className="text-xs font-semibold text-[#0071E3]">
                              {formatarDataHumana(culto.data)}
                            </span>
                            {culto.ehEspecial && (
                              <span className="bg-purple-50 text-purple-700 border border-purple-200/60 text-[11px] font-semibold px-2.5 py-0.5 rounded-full">
                                {culto.textoEspecial || "Programação Especial"}
                              </span>
                            )}
                          </div>
                          <h4 className="text-lg font-semibold text-[#1D1D1F]">
                            {culto.titulo}
                          </h4>
                        </div>

                        <button
                          onClick={() => excluirCulto(culto.id)}
                          className="text-xs text-[#86868B] hover:text-[#FF3B30] hover:bg-[#FF3B30]/10 px-2.5 py-1 rounded-full transition cursor-pointer"
                        >
                          Excluir
                        </button>
                      </div>

                      {renderizarCamposCulto(culto)}
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>
        )}

        {/* ABA 2: MÚSICOS COM BOTÃO "FILTRAR" AO LADO ESQUERDO DE "ADICIONAR MÚSICO" */}
        {abaAtiva === "musicos" && (
          <div className="space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-[#0071E3] mb-1">
                  Equipe Instrumental
                </p>
                <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-[#1D1D1F]">
                  Músicos
                </h1>
              </div>

              <div className="flex items-center gap-2.5 relative self-start sm:self-auto">
                {/* Botão Filtrar ao lado esquerdo de Adicionar Músico */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setMenuFiltroAberto((prev) => !prev)}
                    className={`rounded-full px-5 py-2.5 text-xs font-medium transition shadow-2xs border cursor-pointer flex items-center gap-2 ${
                      instrumentoFiltro !== "Todos"
                        ? "bg-[#1D1D1F] text-white border-[#1D1D1F]"
                        : "bg-white hover:bg-[#E8E8ED]/60 text-[#1D1D1F] border-[#D2D2D7]"
                    }`}
                  >
                    <span>
                      {instrumentoFiltro === "Todos"
                        ? "Filtrar"
                        : `Filtro: ${instrumentoFiltro}`}
                    </span>
                    <span className="text-[10px]">▾</span>
                  </button>

                  {menuFiltroAberto && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-2xl shadow-xl border border-black/[0.08] py-2 z-30">
                      <button
                        type="button"
                        onClick={() => {
                          setInstrumentoFiltro("Todos");
                          setMenuFiltroAberto(false);
                        }}
                        className={`w-full text-left px-4 py-2 text-xs font-medium hover:bg-[#F5F5F7] transition cursor-pointer ${
                          instrumentoFiltro === "Todos"
                            ? "text-[#0071E3] font-semibold"
                            : "text-[#1D1D1F]"
                        }`}
                      >
                        Mostrar todos
                      </button>
                      <div className="my-1 border-t border-[#F5F5F7]" />
                      {LISTA_INSTRUMENTOS.map((inst) => {
                        const cfg = INSTRUMENTOS_CONFIG[inst];
                        return (
                          <button
                            type="button"
                            key={inst}
                            onClick={() => {
                              setInstrumentoFiltro(inst);
                              setMenuFiltroAberto(false);
                            }}
                            className={`w-full text-left px-4 py-2 text-xs font-medium hover:bg-[#F5F5F7] flex items-center gap-2 transition cursor-pointer ${
                              instrumentoFiltro === inst
                                ? "text-[#0071E3] font-semibold"
                                : "text-[#1D1D1F]"
                            }`}
                          >
                            <span
                              className={`w-2 h-2 rounded-full ${cfg.dot}`}
                            />
                            <span>{inst}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Botão Adicionar Músico */}
                <button
                  onClick={() => setModalMusicoAberto(true)}
                  className="bg-[#0071E3] hover:bg-[#0077ED] text-white rounded-full px-5 py-2.5 text-xs font-medium transition shadow-sm cursor-pointer"
                >
                  + Adicionar músico(a)
                </button>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 bg-white px-4 py-3 rounded-2xl border border-black/[0.04]">
              <span className="text-xs font-medium text-[#86868B] mr-1">
                Cores por instrumento:
              </span>
              {LISTA_INSTRUMENTOS.map((inst) => {
                const cfg = INSTRUMENTOS_CONFIG[inst];
                return (
                  <span
                    key={inst}
                    className={`inline-flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-0.5 rounded-full border ${cfg.bg} ${cfg.text} ${cfg.border}`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                    {inst}
                  </span>
                );
              })}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {musicosFiltradosEOrdenados.map((m) => (
                <div
                  key={m.id}
                  className="bg-white rounded-[24px] p-6 shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-black/[0.04] flex flex-col justify-between gap-4"
                >
                  <div className="space-y-2.5">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="text-lg font-semibold tracking-tight text-[#1D1D1F]">
                        {m.nome}
                      </h3>
                      <button
                        onClick={() => excluirMusico(m.id)}
                        className="text-xs text-[#86868B] hover:text-[#FF3B30] hover:bg-[#FF3B30]/10 px-2.5 py-1 rounded-full transition cursor-pointer"
                      >
                        Excluir
                      </button>
                    </div>

                    <div className="flex flex-wrap gap-1.5">
                      {m.instrumentos.map((inst) => {
                        const cfg = INSTRUMENTOS_CONFIG[inst];
                        if (!cfg) return null;
                        return (
                          <span
                            key={inst}
                            className={`inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1 rounded-full border ${cfg.bg} ${cfg.text} ${cfg.border}`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`}
                            />
                            {inst}
                          </span>
                        );
                      })}
                    </div>
                  </div>

                  <div className="pt-3 border-t border-[#F5F5F7] flex items-center justify-between text-xs text-[#86868B]">
                    <span>Telefone</span>
                    <span className="font-medium text-[#1D1D1F]">
                      {m.telefone || "Não informado"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ABA 3: GRUPOS DE LOUVOR */}
        {abaAtiva === "grupos" && (
          <div className="space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-[#0071E3] mb-1">
                  Louvor Congregacional
                </p>
                <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-[#1D1D1F]">
                  Grupos de Louvor
                </h1>
              </div>

              <button
                onClick={() => setModalGrupoAberto(true)}
                className="bg-[#0071E3] hover:bg-[#0077ED] text-white rounded-full px-5 py-2.5 text-xs font-medium transition shadow-sm cursor-pointer self-start sm:self-auto"
              >
                + Adicionar grupo de louvor
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {grupos.map((g) => (
                <div
                  key={g.id}
                  className="bg-white rounded-[28px] p-6 shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-black/[0.04] flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="text-xl font-semibold tracking-tight text-[#1D1D1F]">
                        {g.nome}
                      </h3>
                      <button
                        onClick={() => excluirGrupo(g.id)}
                        className="text-xs text-[#86868B] hover:text-[#FF3B30] hover:bg-[#FF3B30]/10 px-2.5 py-1 rounded-full transition cursor-pointer shrink-0"
                      >
                        Excluir
                      </button>
                    </div>

                    <p className="text-sm text-[#86868B] leading-relaxed">
                      {g.integrantes}
                    </p>
                  </div>

                  <div className="pt-4 border-t border-[#F5F5F7] flex items-center justify-between text-xs text-[#86868B]">
                    <span>Sábados escalados</span>
                    <span className="font-semibold text-[#1D1D1F] bg-[#F5F5F7] px-2.5 py-1 rounded-full">
                      {cultos.filter((c) => c.grupoLouvorId === g.id).length}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ABA 4: MENSAGENS */}
        {abaAtiva === "mensagens" && (
          <div className="space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-[#0071E3] mb-1">
                  Comunicação da Equipe
                </p>
                <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-[#1D1D1F]">
                  Mensagens
                </h1>
              </div>

              <button
                onClick={() => setModalAvisoAberto(true)}
                className="bg-[#0071E3] hover:bg-[#0077ED] text-white rounded-full px-5 py-2.5 text-xs font-medium transition shadow-sm cursor-pointer self-start sm:self-auto"
              >
                + Adicionar mensagem
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-[28px] p-6 sm:p-8 shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-black/[0.04] space-y-4">
                <div>
                  <h3 className="text-lg font-semibold text-[#1D1D1F]">
                    Mensagem para o Whatsapp
                  </h3>
                  <p className="text-xs text-[#86868B]">
                    Gerado automaticamente de acordo com dados da Escala Geral.
                  </p>
                </div>

                {/* Seletor de qual culto gerar a mensagem */}
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#86868B] mb-1.5">
                    Escolher Culto
                  </label>
                  <select
                    value={cultoWhatsappId}
                    onChange={(e) => setCultoWhatsappId(e.target.value)}
                    className="w-full bg-[#F5F5F7] focus:bg-white border border-transparent focus:border-[#0071E3] rounded-xl px-3.5 py-2.5 text-sm font-medium text-[#1D1D1F] outline-none transition"
                  >
                    {cultosOrdenados.map((c) => (
                      <option key={c.id} value={c.id}>
                        {formatarDataCurta(c.data)} — {c.titulo}
                        {c.ehEspecial && c.textoEspecial
                          ? ` (${c.textoEspecial})`
                          : ""}
                      </option>
                    ))}
                  </select>
                </div>

                <textarea
                  id="texto-whatsapp"
                  readOnly
                  rows={16}
                  className="w-full bg-[#F5F5F7] text-[#1D1D1F] font-mono text-xs p-4 rounded-2xl border border-black/[0.04] outline-none"
                  value={textoWhatsappGerado}
                />

                <button
                  onClick={() => {
                    navigator.clipboard.writeText(textoWhatsappGerado);
                    alert("Mensagem copiada para o WhatsApp!");
                  }}
                  className="w-full bg-[#1D1D1F] hover:bg-black text-white font-medium text-xs py-3 rounded-full transition cursor-pointer"
                >
                  Copiar Mensagem para o WhatsApp
                </button>
              </div>

              <div className="space-y-4">
                {avisos.map((aviso) => (
                  <div
                    key={aviso.id}
                    className="bg-white rounded-[24px] p-6 shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-black/[0.04] flex items-start justify-between gap-4"
                  >
                    <div className="space-y-1">
                      <h4 className="font-semibold text-base text-[#1D1D1F]">
                        {aviso.titulo}
                      </h4>
                      <p className="text-sm text-[#86868B] leading-relaxed">
                        {aviso.texto}
                      </p>
                    </div>
                    <button
                      onClick={() => excluirAviso(aviso.id)}
                      className="text-xs text-[#86868B] hover:text-[#FF3B30] hover:bg-[#FF3B30]/10 px-2.5 py-1 rounded-full transition cursor-pointer shrink-0"
                    >
                      Excluir
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* ==========================================
          MODAL 1: ADICIONAR CULTO (SÁBADO OU OUTRO DIA)
         ========================================== */}
      {modalCultoAberto && (
        <div className="fixed inset-0 z-50 bg-black/30 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!novaData) return;
              const ehOutro = novoTipoProg === "outro";
              setCultos((prev) => [
                ...prev,
                {
                  id: "c" + Date.now(),
                  data: novaData,
                  tipoProgramacao: novoTipoProg,
                  titulo:
                    novoTitulo ||
                    (ehOutro ? "Programação Especial" : "Culto de Sábado"),
                  ehEspecial: ehOutro ? true : novoEspecial,
                  textoEspecial: ehOutro
                    ? novoTextoEspecial || novoTitulo
                    : novoEspecial
                    ? novoTextoEspecial
                    : "",
                  pregador: novoPregador,
                  grupoLouvorId: "",
                  louvorAvulso: "",
                  bandaIds: [],
                  mmNome: "",
                  mmTelefone: "",
                  mmQtdMusicas: 1,
                  musicasEscolaSabatina: [],
                  musicasCulto: [],
                  musicasGeral: [],
                },
              ]);
              setNovaData("");
              setNovoPregador("");
              setNovoEspecial(false);
              setNovoTextoEspecial("");
              setNovoTipoProg("sabado");
              setNovoTitulo("Culto de Sábado");
              setModalCultoAberto(false);
            }}
            className="bg-white rounded-[28px] p-6 sm:p-8 max-w-lg w-full shadow-2xl border border-black/[0.05] space-y-4"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-[#1D1D1F]">
                Adicionar Culto
              </h3>
              <button
                type="button"
                onClick={() => setModalCultoAberto(false)}
                className="text-xs text-[#86868B] hover:text-[#1D1D1F]"
              >
                Fechar ✕
              </button>
            </div>

            {/* Botões de seleção do Tipo de Culto */}
            <div>
              <label className="block text-xs font-medium text-[#86868B] mb-1.5">
                Estrutura da Programação
              </label>
              <div className="grid grid-cols-2 gap-2 bg-[#F5F5F7] p-1 rounded-2xl">
                <button
                  type="button"
                  onClick={() => {
                    setNovoTipoProg("sabado");
                    setNovoTitulo("Culto de Sábado");
                  }}
                  className={`py-2.5 px-3 rounded-xl text-xs font-semibold transition cursor-pointer ${
                    novoTipoProg === "sabado"
                      ? "bg-white text-[#1D1D1F] shadow-xs"
                      : "text-[#86868B] hover:text-[#1D1D1F]"
                  }`}
                >
                  Culto de Sábado
                  <span className="block text-[10px] font-normal text-[#86868B]">
                    Escola Sabatina + Culto
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setNovoTipoProg("outro");
                    setNovoTitulo("Programação Especial");
                  }}
                  className={`py-2.5 px-3 rounded-xl text-xs font-semibold transition cursor-pointer ${
                    novoTipoProg === "outro"
                      ? "bg-white text-[#1D1D1F] shadow-xs"
                      : "text-[#86868B] hover:text-[#1D1D1F]"
                  }`}
                >
                  Outro Dia / Evento Especial
                  <span className="block text-[10px] font-normal text-[#86868B]">
                    Lista única de músicas
                  </span>
                </button>
              </div>
            </div>

            <div className="space-y-3.5 text-sm">
              <div>
                <label className="block text-xs font-medium text-[#86868B] mb-1">
                  Data do Culto
                </label>
                <input
                  type="date"
                  required
                  value={novaData}
                  onChange={(e) => setNovaData(e.target.value)}
                  className="w-full bg-[#F5F5F7] rounded-xl px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#0071E3]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#86868B] mb-1">
                  Título do Culto
                </label>
                <input
                  type="text"
                  value={novoTitulo}
                  onChange={(e) => setNovoTitulo(e.target.value)}
                  placeholder="Ex: Culto de Sábado / Quarta-feira"
                  className="w-full bg-[#F5F5F7] rounded-xl px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#0071E3]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#86868B] mb-1">
                  Pregador(a)
                </label>
                <input
                  type="text"
                  value={novoPregador}
                  onChange={(e) => setNovoPregador(e.target.value)}
                  placeholder="Ex: Pr. Marcos"
                  className="w-full bg-[#F5F5F7] rounded-xl px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#0071E3]"
                />
              </div>

              {novoTipoProg === "sabado" ? (
                <div className="pt-1">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                    <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-[#1D1D1F] shrink-0">
                      <input
                        type="checkbox"
                        checked={novoEspecial}
                        onChange={(e) => setNovoEspecial(e.target.checked)}
                        className="rounded accent-[#0071E3] w-4 h-4"
                      />
                      <span>Programação Especial</span>
                    </label>

                    {novoEspecial && (
                      <input
                        type="text"
                        required
                        value={novoTextoEspecial}
                        onChange={(e) => setNovoTextoEspecial(e.target.value)}
                        placeholder="Qual é a programação especial? (Ex: Santa Ceia)"
                        className="w-full bg-purple-50/70 border border-purple-200 rounded-xl px-3.5 py-2 text-xs font-medium text-purple-900 placeholder:text-purple-400 outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    )}
                  </div>
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-medium text-[#86868B] mb-1">
                    Motivo / Nome da Programação Especial (Selo Roxo)
                  </label>
                  <input
                    type="text"
                    required
                    value={novoTextoEspecial}
                    onChange={(e) => setNovoTextoEspecial(e.target.value)}
                    placeholder="Ex: Semana de Oração / Vigília Jovem"
                    className="w-full bg-purple-50/70 border border-purple-200 rounded-xl px-3.5 py-2.5 text-xs font-medium text-purple-900 placeholder:text-purple-400 outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setModalCultoAberto(false)}
                className="px-4 py-2 rounded-full text-xs font-medium bg-[#F5F5F7] text-[#1D1D1F]"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-full text-xs font-medium bg-[#0071E3] text-white"
              >
                Adicionar Culto
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL 2: ADICIONAR MÚSICO */}
      {modalMusicoAberto && (
        <div className="fixed inset-0 z-50 bg-black/30 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!novoMusicoNome) return;
              setMusicos((prev) => [
                ...prev,
                {
                  id: "m" + Date.now(),
                  nome: novoMusicoNome,
                  instrumentos: novoMusicoInsts,
                  telefone: novoMusicoTel,
                },
              ]);
              setNovoMusicoNome("");
              setNovoMusicoTel("");
              setNovoMusicoInsts(["Piano"]);
              setModalMusicoAberto(false);
            }}
            className="bg-white rounded-[28px] p-6 sm:p-8 max-w-md w-full shadow-2xl border border-black/[0.05] space-y-4"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-[#1D1D1F]">
                Adicionar Músico(a)
              </h3>
              <button
                type="button"
                onClick={() => setModalMusicoAberto(false)}
                className="text-xs text-[#86868B] hover:text-[#1D1D1F]"
              >
                Fechar ✕
              </button>
            </div>

            <div className="space-y-3 text-sm">
              <div>
                <label className="block text-xs font-medium text-[#86868B] mb-1">
                  Nome Completo
                </label>
                <input
                  type="text"
                  required
                  value={novoMusicoNome}
                  onChange={(e) => setNovoMusicoNome(e.target.value)}
                  placeholder="Ex: Gabriel Santos"
                  className="w-full bg-[#F5F5F7] rounded-xl px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#0071E3]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#86868B] mb-1.5">
                  Instrumentos que toca
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {LISTA_INSTRUMENTOS.map((inst) => {
                    const ativo = novoMusicoInsts.includes(inst);
                    const cfg = INSTRUMENTOS_CONFIG[inst];
                    return (
                      <button
                        type="button"
                        key={inst}
                        onClick={() => alternarInstrumentoNoForm(inst)}
                        className={`text-xs font-medium px-3 py-1.5 rounded-full border transition cursor-pointer ${
                          ativo
                            ? `${cfg.bg} ${cfg.text}${cfg.border} ring-2 ring-[#0071E3]/40`
                            : "bg-[#F5F5F7] text-[#86868B] border-transparent hover:text-[#1D1D1F]"
                        }`}
                      >
                        {inst}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#86868B] mb-1">
                  Telefone
                </label>
                <input
                  type="text"
                  value={novoMusicoTel}
                  onChange={(e) => setNovoMusicoTel(e.target.value)}
                  placeholder="(11) 99999-9999"
                  className="w-full bg-[#F5F5F7] rounded-xl px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#0071E3]"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setModalMusicoAberto(false)}
                className="px-4 py-2 rounded-full text-xs font-medium bg-[#F5F5F7] text-[#1D1D1F]"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-full text-xs font-medium bg-[#0071E3] text-white"
              >
                Salvar Músico
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL 3: ADICIONAR GRUPO DE LOUVOR */}
      {modalGrupoAberto && (
        <div className="fixed inset-0 z-50 bg-black/30 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!novoGrupoNome) return;
              setGrupos((prev) => [
                ...prev,
                {
                  id: "g" + Date.now(),
                  nome: novoGrupoNome,
                  integrantes: novoGrupoIntegrantes,
                },
              ]);
              setNovoGrupoNome("");
              setNovoGrupoIntegrantes("");
              setModalGrupoAberto(false);
            }}
            className="bg-white rounded-[28px] p-6 sm:p-8 max-w-md w-full shadow-2xl border border-black/[0.05] space-y-4"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-[#1D1D1F]">
                Adicionar Grupo de Louvor
              </h3>
              <button
                type="button"
                onClick={() => setModalGrupoAberto(false)}
                className="text-xs text-[#86868B] hover:text-[#1D1D1F]"
              >
                Fechar ✕
              </button>
            </div>

            <div className="space-y-3 text-sm">
              <div>
                <label className="block text-xs font-medium text-[#86868B] mb-1">
                  Nome do Grupo
                </label>
                <input
                  type="text"
                  required
                  value={novoGrupoNome}
                  onChange={(e) => setNovoGrupoNome(e.target.value)}
                  placeholder="Ex: Grupo Redenção"
                  className="w-full bg-[#F5F5F7] rounded-xl px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#0071E3]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#86868B] mb-1">
                  Pessoas que fazem parte do grupo
                </label>
                <textarea
                  rows={3}
                  required
                  value={novoGrupoIntegrantes}
                  onChange={(e) => setNovoGrupoIntegrantes(e.target.value)}
                  placeholder="Ex: Mariana, Carlos, Juliana, André"
                  className="w-full bg-[#F5F5F7] rounded-xl px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#0071E3]"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setModalGrupoAberto(false)}
                className="px-4 py-2 rounded-full text-xs font-medium bg-[#F5F5F7] text-[#1D1D1F]"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-full text-xs font-medium bg-[#0071E3] text-white"
              >
                Salvar Grupo
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL 4: ADICIONAR MENSAGEM */}
      {modalAvisoAberto && (
        <div className="fixed inset-0 z-50 bg-black/30 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!novoAvisoTitulo) return;
              setAvisos((prev) => [
                ...prev,
                {
                  id: "a" + Date.now(),
                  titulo: novoAvisoTitulo,
                  texto: novoAvisoTexto,
                },
              ]);
              setNovoAvisoTitulo("");
              setNovoAvisoTexto("");
              setModalAvisoAberto(false);
            }}
            className="bg-white rounded-[28px] p-6 sm:p-8 max-w-md w-full shadow-2xl border border-black/[0.05] space-y-4"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-[#1D1D1F]">
                Adicionar Mensagem
              </h3>
              <button
                type="button"
                onClick={() => setModalAvisoAberto(false)}
                className="text-xs text-[#86868B] hover:text-[#1D1D1F]"
              >
                Fechar ✕
              </button>
            </div>

            <div className="space-y-3 text-sm">
              <div>
                <label className="block text-xs font-medium text-[#86868B] mb-1">
                  Título
                </label>
                <input
                  type="text"
                  required
                  value={novoAvisoTitulo}
                  onChange={(e) => setNovoAvisoTitulo(e.target.value)}
                  placeholder="Ex: Ensaio Geral para Cantata"
                  className="w-full bg-[#F5F5F7] rounded-xl px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#0071E3]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#86868B] mb-1">
                  Mensagem
                </label>
                <textarea
                  rows={3}
                  required
                  value={novoAvisoTexto}
                  onChange={(e) => setNovoAvisoTexto(e.target.value)}
                  placeholder="Escreva a orientação para a equipe..."
                  className="w-full bg-[#F5F5F7] rounded-xl px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#0071E3]"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setModalAvisoAberto(false)}
                className="px-4 py-2 rounded-full text-xs font-medium bg-[#F5F5F7] text-[#1D1D1F]"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-full text-xs font-medium bg-[#0071E3] text-white"
              >
                Publicar
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}