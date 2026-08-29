// ULF R&D Dashboard — English / Portuguese strings and the swap engine.
//
// Classic script (not a module) so the standalone survey page can reuse it, and
// so it is parsed before app.js renders anything.
//
// HOW MARKUP OPTS IN
//   data-i18n="key"                  -> replaces textContent
//   data-i18n-html="key"             -> replaces innerHTML (only for strings this
//                                       file authors; never for user input)
//   data-i18n-attr="placeholder:key" -> sets one or more attributes,
//                                       semicolon separated
//
// Portuguese is pt-BR: the first partner university is UTFPR in Curitiba.

(function () {
  'use strict';

  const STORE_KEY = 'ulf-lang';
  const DEFAULT = 'en';

  const STRINGS = {
    en: {
      /* ---------------------------------------------------------- chrome */
      'doc.title': 'Universal Limbs — R&D Dashboard',
      'brand.sub': 'R&D dashboard',
      'brand.logoAlt': 'Universal Limbs logo',
      'top.year1': 'Year 1',
      'top.year2': 'Year 2',
      'top.feedback': 'Send feedback',
      'top.drive': 'Open the shared drive',
      'lang.label': 'Language',

      'nav.dashboard': 'Dashboard',
      'nav.goal': 'Goal',
      'nav.resources': 'Resources',
      'nav.portal': 'University collaboration',
      'nav.downloads': 'Downloads',
      'nav.aria': 'R&D sections',

      'side.team': 'Team',
      'side.remind': 'Send friendly reminder',

      /* -------------------------------------------------------- dashboard */
      'hero.morning': 'Good morning, ULF',
      'hero.afternoon': 'Good afternoon, ULF',
      'hero.evening': 'Good evening, ULF',
      'hero.sub': 'Pediatric prosthetic hand programme — here is where the work stands today.',

      'stats.progress': 'Project progress',
      'stats.overall': 'Overall',
      'stats.completed': 'Completed',
      'stats.inProgress': 'In progress',
      'stats.todo': 'To do',
      'stats.focus': "Today's focus",
      'focus.bowden': 'Review Bowden routing',
      'focus.results': 'Upload test results',
      'focus.tracker': 'Update requirements tracker',
      'focus.finger': 'Prototype finger v2',
      'focus.dueToday': 'Due today',
      'focus.tomorrow': 'Tomorrow',
      'focus.aug30': 'Aug 30',

      'meeting.month': 'Aug',
      'meeting.title': 'ULF R&D weekly meeting',
      'meeting.when': 'Wednesday, Aug 27 · 11:00 AM PT',
      'meeting.join': 'Join meeting',

      'summary.heading': 'Project summary',
      'summary.p1': 'A low-cost, repairable, 3D-printable pediatric prosthetic hand for children aged 6–12 affected by war, eventually implemented in Egypt for Gazan evacuees.',
      'summary.p2': 'The MVP focuses on safe, repeatable, articulated lateral pinch to help a child hold, stabilise and interact with light daily objects — not heavy lifting, adult-level grip strength or full independent finger control.',
      'summary.p3': 'The mechanism draws on tendon-driven underactuated hand research while avoiding unnecessary complexity, targeting light daily tasks such as holding a card, paper, small toy, utensil handle or lightweight object.',
      'summary.p4': 'The design prioritises repeatability, comfort, repairability and safe use in hot, resource-limited settings: lightweight, durable, affordable and clinically reviewed, with precision coming from thumb–index alignment, guided tendon routing, mechanical stops, soft contact pads and adjustable tension rather than motors.',
      'summary.updated': 'Last updated on July 15th, 2026',

      /* ------------------------------------------------------------- team */
      'team.heading': 'R&D team',
      'team.experience': 'Experience:',
      'team.assign': 'Assign task',

      'team.rasna.role': 'Founder / R&D Direction',
      'team.rasna.exp': 'Electrical engineering, program strategy, partner direction, and MVP decision flow.',
      'team.rasna.tip': 'Owns project direction, priorities, partner alignment, and final decision flow.',
      'team.sahitya.role': 'Project Manager',
      'team.sahitya.exp': 'Coordination, timelines, task tracking, files, and external handoff support.',
      'team.sahitya.tip': 'Coordinates assignments, timelines, files, team follow-up, and external handoff.',
      'team.saja.role': 'Director of Prosthetic Services',
      'team.saja.exp': 'Clinical prosthetic review, rehab practicality, user safety, and device-fit feedback.',
      'team.saja.tip': 'Provides prosthetic, rehab, and clinical practicality feedback.',
      'team.ana.role': 'Director of Finance',
      'team.ana.exp': 'Budget tracking, funding readiness, finance controls, and sponsor documentation.',
      'team.ana.tip': 'Supports budget tracking, funding readiness, and financial documentation.',
      'team.maria.role': 'University Partnership Lead',
      'team.maria.exp': 'University collaboration, student coordination, partner communication, and file handoff.',
      'team.maria.tip': 'Supports university collaboration, partner communication, and student handoff.',

      /* ---------------------------------------------------------- updates */
      'updates.heading': 'Latest updates',
      'updates.current': 'Current',
      'updates.next': 'Next',
      'updates.link': 'Link',
      'updates.prev': 'Previous update',
      'updates.nextBtn': 'Next update',

      'upd.survey.title': 'Survey updates',
      'upd.survey.current': 'Getting feedback from Alex Low.',
      'upd.survey.next': 'Send to 2 prosthetic users for early feedback.',
      'upd.survey.cta': 'View survey',
      'upd.deck.title': 'Presentation for UTFPR',
      'upd.deck.current': 'Prepare partner-facing presentation for external review.',
      'upd.deck.next': 'Add final scope, test bench ask, and file handoff instructions.',
      'upd.deck.cta': 'UTFPR presentation',
      'upd.base.title': 'Base design ready to print',
      'upd.base.current': 'WAACS / e-NABLE-style base design is the starting printable basis.',
      'upd.base.next': 'Attach print link, material notes, and estimated price.',
      'upd.base.cta': 'Attach links / price',
      'upd.hybrid.title': 'Stay open to hybrid methods',
      'upd.hybrid.current': 'Advice from prosthetist at OPRC: keep design options open and avoid overcommitting too early.',
      'upd.hybrid.next': 'Compare hybrid approaches against simplicity, repairability, and child use.',
      'upd.hybrid.cta': 'Notes',

      /* -------------------------------------------------------- documents */
      'docs.heading': 'Documents',
      'docs.open': 'Open',
      'docs.req.title': 'Design requirements',
      'docs.req.body': 'Owner: Ganesh, Rasna, Abhay, Nili.',
      'docs.survey.title': 'Surveys',
      'docs.survey.body': 'Open prosthetic-user survey and feedback files.',
      'docs.budget.title': 'Budget',
      'docs.budget.body': 'Open budget approval and funding tracker.',
      'docs.bench.title': 'Test bench package',
      'docs.bench.body': 'Open the University collaboration tab for the test rig build reference and handoff package.',
      'docs.tracker.title': 'Requirements tracker',
      'docs.tracker.body': 'Open design requirement tracker and status notes.',
      'docs.visuals.title': 'Reference visuals',
      'docs.visuals.body': 'Open inspiration visuals inside the Goal section.',

      /* ------------------------------------------------------------- goal */
      'goal.title': 'Design direction',
      'goal.owner': 'Owner: Rasna Mantha',
      'goal.edit': 'Edit milestones',
      'goal.week': 'This week',
      'goal.month': 'This month',
      'goal.year': 'The year',
      'goal.weekSummary': 'This week: confirm survey feedback path and prepare the test bench handoff.',
      'goal.monthSummary': 'This month: lock the design requirement package, confirm survey review, and define what the university students should build first.',
      'goal.yearSummary': 'Click the lime milestone dots to view the inspiration visual. Visuals are references only.',
      'goal.hint': '● lime dot = click to see the reference visual',
      'goal.milestone': 'Milestone',
      'goal.survey': 'Survey',
      'goal.budget': 'Budget',

      /* -------------------------------------------------------- resources */
      'res.playbooks': 'Playbooks',
      'res.sops': 'SOPs',
      'res.links': 'Links',
      'res.presentations': 'Presentations',
      'res.addLink': 'Add link',
      'res.open': 'Open',
      'res.rd.title': 'R&D Playbook',
      'res.rd.body': 'Team process and decision rules placeholder.',
      'res.testing.title': 'Testing Playbook',
      'res.testing.body': 'Test setup, logging, and review method placeholder.',
      'res.intake.title': 'Design Intake SOP',
      'res.intake.body': 'Requesting concept, CAD, and design work.',
      'res.upload.title': 'Document Upload SOP',
      'res.upload.body': 'Naming, versioning, and handoff process.',
      'res.software.title': 'Project Software',
      'res.software.body': 'Current project management software placeholder.',
      'res.drive.title': 'Drive Folder',
      'res.drive.body': 'Main Google Drive folder. Shared with universallimbs.com accounts only.',
      'res.utfpr.title': 'UTFPR Presentation',
      'res.utfpr.body': 'Partner-facing presentation.',
      'res.overview.title': 'Project Overview Deck',
      'res.overview.body': 'General R&D overview presentation placeholder.',

      /* ----------------------------------------------------------- portal */
      'portal.submit': 'Submit deliverable',
      'portal.flowTip': 'University collaboration → Submit deliverable → Required information and file are recorded → Reviewer receives an email → UL reviews → Approved file moves to the Shared Drive → Aquido is updated → Next owner continues.',
      'portal.deck': 'University collaboration presentation',
      'portal.processFlow': 'Process flow',
      'portal.rigTitle': 'Automated test rig architecture',
      'portal.rigAlt': 'Automated test rig architecture',
      'portal.hoverHelp': 'Hover or click a number to see the part detail.',
      'portal.parts': 'Parts labelled',
      'portal.system': 'System overview',

      'part.motor': 'Linear motor',
      'part.motor.d': 'Provides controlled linear motion.',
      'part.cableCell': 'Cable load cell',
      'part.cableCell.d': 'Measures tension in the cable.',
      'part.bowden': 'Bowden cable / tendon input',
      'part.bowden.d': 'Transfers force to the hand.',
      'part.bed': 'Fixed bed',
      'part.bed.d': 'Rigid base to hold the mount in place.',
      'part.wrist': 'Wrist mount',
      'part.wrist.d': 'Secures the 3D printed hand.',
      'part.hand': '3D printed hand',
      'part.hand.d': 'Device under test.',
      'part.gripCell': 'Grip target load cell',
      'part.gripCell.d': 'Measures grip force applied by the hand.',
      'part.daq': 'DAQ controller',
      'part.daq.d': 'Collects data from sensors and motors.',
      'part.python': 'Python interface',
      'part.python.d': 'Plotting, control, and data logging.',
      'part.actuator': 'Linear actuator',
      'part.tendon': 'Bowden / tendon cable',
      'part.daqLog': 'DAQ + Python log',

      'brief.heading': 'Student build brief',
      'brief.goal': 'Project goal',
      'brief.goal.d': 'Design and validate a compact benchtop test rig for 3D-printed prosthetic hands that can measure force transfer, cable loading, and grip performance under repeatable operating conditions.',
      'brief.concept': 'Core concept',
      'brief.concept.d': 'The rig applies a controlled cable pull, measures input and output force using load cells, and logs the data for repeatable evaluation of fatigue, wear, and slip behavior.',
      'brief.hardware': 'Flexible hardware',
      'brief.hardware.d': 'Teams may use equivalent motors, drivers, sensors, and fixtures based on cost, availability, and experience. The objective is to achieve similar test fidelity with a practical, buildable system.',
      'brief.themes': 'Evaluation themes',
      'brief.themes.d': 'Key test themes include force transfer, cyclic fatigue, grip retention, slip resistance, creep, and environmental wear under repeated loading.',

      /* -------------------------------------------------------- downloads */
      'dl.title': 'Downloads',
      'dl.owner': 'Reference packages for university teams — download, build, then report back.',
      'dl.submit': 'Submit project response',
      'dl.tip': 'Every download expects a response. Download the package → build or review it → submit a project response so UL knows the status, findings and what you need next.',
      'dl.available': 'Available packages',
      'dl.download': 'Download',
      'dl.open': 'Open',
      'dl.respond': 'Submit response',
      'dl.responses': 'Project responses',
      'dl.colPackage': 'Package',
      'dl.colTeam': 'Team',
      'dl.colDate': 'Last response',
      'dl.colStatus': 'Status',
      'dl.empty': 'No responses submitted from this device yet.',
      'dl.note': 'Responses you submit from this device are listed here immediately. The reviewer copy is recorded centrally and emailed to the R&D team.',

      'dl.bench.title': 'Test bench architecture package',
      'dl.bench.body': 'Full rig architecture diagram, labelled parts list, and the student build brief for the benchtop force-testing rig.',
      'dl.bench.tag': 'Build brief',
      'dl.bench.m1': 'WEBP + brief',
      'dl.bench.m2': 'Priority 1',
      'dl.base.title': 'Base printable hand design',
      'dl.base.body': 'The WAACS / e-NABLE-style base geometry that the MVP starts from. Use it as the printable reference before proposing changes.',
      'dl.base.tag': 'CAD basis',
      'dl.base.m1': 'Reference image',
      'dl.base.m2': 'Priority 1',
      'dl.tracker.title': 'Design requirements tracker',
      'dl.tracker.body': 'Live requirement list with owners and status. Read it before starting so your work maps onto an existing requirement ID.',
      'dl.tracker.tag': 'Spreadsheet',
      'dl.tracker.m1': 'Google Sheet',
      'dl.tracker.m2': 'Read first',
      'dl.survey.title': 'Prosthetic user survey',
      'dl.survey.body': 'The user-research instrument behind the design requirements. Run it locally with consenting participants and report your findings.',
      'dl.survey.tag': 'Survey',
      'dl.survey.m1': 'Web form',
      'dl.survey.m2': 'Ethics required',
      'dl.deck.title': 'University collaboration presentation',
      'dl.deck.body': 'Scope, expectations and the handoff process for partner universities. Start here if you are new to the programme.',
      'dl.deck.tag': 'Deck',
      'dl.deck.m1': 'Canva',
      'dl.deck.m2': 'Start here',
      'dl.visuals.title': 'Reference visuals bundle',
      'dl.visuals.body': 'Yale multigrasp and SoftFoot Pro milestone references. Inspiration only — do not copy the mechanism directly.',
      'dl.visuals.tag': 'Visuals',
      'dl.visuals.m1': 'PNG / JPG',
      'dl.visuals.m2': 'Inspiration',

      /* ------------------------------------------------------------ forms */
      'form.close': 'Close',
      'form.deliverable': 'Submit deliverable',
      'form.name': 'Your name',
      'form.email': 'Your email',
      'form.emailHelp': 'The reviewer replies to this address.',
      'form.emailPlaceholder': 'you@university.edu',
      'form.org': 'University / organization',
      'form.task': 'Task name',
      'form.what': 'What are you submitting?',
      'form.choose': 'Choose',
      'form.concept': 'Concept',
      'form.working': 'Working file',
      'form.final': 'Final file',
      'form.research': 'Research or validation result',
      'form.other': 'Other',
      'form.version': 'Version',
      'form.versionPlaceholder': 'For example: v1.2',
      'form.changed': 'What changed?',
      'form.reviewer': 'Send to reviewer',
      'form.selectReviewer': 'Select a reviewer',
      'form.otherReviewer': 'Other reviewer email',
      'form.nextSteps': 'Expected next steps',
      'form.review': 'Review',
      'form.revision': 'Revision required',
      'form.approve': 'Approve',
      'form.testing': 'Testing',
      'form.upload': 'Upload your deliverable file',
      'form.uploadHelp': 'Upload the working or final file for UL review. Maximum 10 MB.',
      'form.notes': 'Notes',
      'form.send': 'Send deliverable',

      'form.response': 'Project response',
      'form.package': 'Which download is this about?',
      'form.choosePackage': 'Choose a package',
      'form.team': 'University / team',
      'form.status': 'Status',
      'form.statusNotStarted': 'Downloaded — not started',
      'form.statusProgress': 'In progress',
      'form.statusDone': 'Completed',
      'form.statusBlocked': 'Blocked',
      'form.statusStopped': 'Not proceeding',
      'form.workDone': 'What did you do with it?',
      'form.workDonePlaceholder': 'What you built, tested, reviewed or changed.',
      'form.findings': 'Findings or issues',
      'form.findingsPlaceholder': 'What worked, what did not, and anything that blocked you.',
      'form.needs': 'What do you need from UL next?',
      'form.needsPlaceholder': 'Files, decisions, review, or a call.',
      'form.supportFile': 'Supporting file (optional)',
      'form.supportHelp': 'Photos, data logs, CAD or a short report. Maximum 10 MB.',
      'form.sendResponse': 'Send response',
      'form.teamReplies': 'The R&D team replies to this address.',

      'form.editMilestones': 'Edit milestones',
      'form.addMilestone': 'Add milestone',
      'form.saveChanges': 'Save changes',
      'form.label': 'Label',
      'form.range': 'Range',
      'form.titleField': 'Title',
      'form.visualTitle': 'Visual title',
      'form.image': 'Image',
      'form.visualText': 'Visual text',
      'form.weekStart': 'Week start',
      'form.weekEnd': 'Week end',
      'form.monthStart': 'Month start',
      'form.monthEnd': 'Month end',
      'form.yearStart': 'Year start',
      'form.yearEnd': 'Year end',
      'form.visual': 'Visual',

      /* --------------------------------------------------------- statuses */
      'msg.notConfigured': 'Submissions are not configured yet. Set submissionEndpoint in assets/js/config.js.',
      'msg.chooseFile': 'Choose a deliverable file to continue.',
      'msg.tooLarge': 'The selected file is larger than the 10 MB limit.',
      'msg.sending': 'Sending deliverable...',
      'msg.sendingResponse': 'Sending response...',
      'msg.sent': 'Deliverable sent. The reviewer has been emailed and you will receive a receipt.',
      'msg.responseSent': 'Response recorded. The R&D team has been notified.',

      /* ----------------------------------------------------------- footer */
      'footer.text': 'feedback stays visible on every page',
      'footer.link': 'send feedback',

      /* --------------------------------------------------- timeline heads */
      'tl.milestone': 'Milestone',
      'tl.mon': 'Mon', 'tl.tue': 'Tue', 'tl.wed': 'Wed', 'tl.thu': 'Thu',
      'tl.fri': 'Fri', 'tl.sat': 'Sat', 'tl.sun': 'Sun',
      'tl.w1': 'W1', 'tl.w2': 'W2', 'tl.w3': 'W3', 'tl.w4': 'W4', 'tl.w5': 'W5',
      'tl.aug': 'Aug', 'tl.sep': 'Sep', 'tl.oct': 'Oct', 'tl.nov': 'Nov',
      'tl.dec': 'Dec', 'tl.jan': 'Jan', 'tl.feb': 'Feb', 'tl.mar': 'Mar',
      'tl.apr': 'Apr', 'tl.may': 'May', 'tl.jun': 'Jun', 'tl.jul': 'Jul',

      'ms.1.label': 'Milestone 1',
      'ms.1.range': 'Aug—Nov 2026',
      'ms.1.title': 'Simplified Yale hand multigrasp',
      'ms.1.visualTitle': 'Milestone 1 · Yale Hand',
      'ms.1.visualText': 'Inspiration only. Study grasp modes and simplify the mechanical strategy for the MVP.',
      'ms.2.label': 'Milestone 2',
      'ms.2.range': 'Dec 2026—Mar 2027',
      'ms.2.title': 'Integrate SoftFoot Pro geometry',
      'ms.2.visualTitle': 'Milestone 2 · SoftFoot Pro',
      'ms.2.visualText': 'Inspiration only. Translate passive adaptive geometry only if it makes the hand simpler and more useful.',
      'ms.3.label': 'Milestone 3',
      'ms.3.range': 'Apr—Jul 2027',
      'ms.3.title': 'External mechanical energy resource',
      'ms.3.visualTitle': 'Milestone 3 · Mechanical Energy',
      'ms.3.visualText': 'Placeholder visual. Explore purely mechanical energy assistance only.'
    },

    pt: {
      /* ---------------------------------------------------------- chrome */
      'doc.title': 'Universal Limbs — Painel de P&D',
      'brand.sub': 'Painel de P&D',
      'brand.logoAlt': 'Logotipo da Universal Limbs',
      'top.year1': 'Ano 1',
      'top.year2': 'Ano 2',
      'top.feedback': 'Enviar comentários',
      'top.drive': 'Abrir o drive compartilhado',
      'lang.label': 'Idioma',

      'nav.dashboard': 'Painel',
      'nav.goal': 'Metas',
      'nav.resources': 'Recursos',
      'nav.portal': 'Colaboração universitária',
      'nav.downloads': 'Downloads',
      'nav.aria': 'Seções de P&D',

      'side.team': 'Equipe',
      'side.remind': 'Enviar lembrete amigável',

      /* -------------------------------------------------------- dashboard */
      'hero.morning': 'Bom dia, ULF',
      'hero.afternoon': 'Boa tarde, ULF',
      'hero.evening': 'Boa noite, ULF',
      'hero.sub': 'Programa de mão protética pediátrica — veja como está o trabalho hoje.',

      'stats.progress': 'Progresso do projeto',
      'stats.overall': 'Geral',
      'stats.completed': 'Concluídas',
      'stats.inProgress': 'Em andamento',
      'stats.todo': 'A fazer',
      'stats.focus': 'Foco de hoje',
      'focus.bowden': 'Revisar o roteamento do cabo Bowden',
      'focus.results': 'Enviar os resultados dos testes',
      'focus.tracker': 'Atualizar o rastreador de requisitos',
      'focus.finger': 'Protótipo do dedo v2',
      'focus.dueToday': 'Vence hoje',
      'focus.tomorrow': 'Amanhã',
      'focus.aug30': '30 de ago.',

      'meeting.month': 'Ago',
      'meeting.title': 'Reunião semanal de P&D da ULF',
      'meeting.when': 'Quarta-feira, 27 de ago. · 11h00 (PT)',
      'meeting.join': 'Entrar na reunião',

      'summary.heading': 'Resumo do projeto',
      'summary.p1': 'Uma mão protética pediátrica de baixo custo, reparável e imprimível em 3D para crianças de 6 a 12 anos afetadas pela guerra, com implementação prevista no Egito para evacuados de Gaza.',
      'summary.p2': 'O MVP concentra-se em uma pinça lateral articulada, segura e repetível, para ajudar a criança a segurar, estabilizar e interagir com objetos leves do dia a dia — e não em levantar peso, força de preensão de adulto ou controle independente completo dos dedos.',
      'summary.p3': 'O mecanismo baseia-se em pesquisas de mãos subatuadas acionadas por tendões, evitando complexidade desnecessária, e tem como alvo tarefas leves do cotidiano, como segurar um cartão, papel, brinquedo pequeno, cabo de talher ou objeto leve.',
      'summary.p4': 'O projeto prioriza repetibilidade, conforto, reparabilidade e uso seguro em ambientes quentes e com poucos recursos: leve, durável, acessível e clinicamente revisado, com a precisão vindo do alinhamento polegar–indicador, do roteamento guiado dos tendões, de batentes mecânicos, de almofadas de contato macias e da tensão ajustável, em vez de motores.',
      'summary.updated': 'Última atualização em 15 de julho de 2026',

      /* ------------------------------------------------------------- team */
      'team.heading': 'Equipe de P&D',
      'team.experience': 'Experiência:',
      'team.assign': 'Atribuir tarefa',

      'team.rasna.role': 'Fundadora / Direção de P&D',
      'team.rasna.exp': 'Engenharia elétrica, estratégia de programa, direção de parcerias e fluxo de decisão do MVP.',
      'team.rasna.tip': 'Responsável pela direção do projeto, prioridades, alinhamento com parceiros e decisão final.',
      'team.sahitya.role': 'Gerente de Projeto',
      'team.sahitya.exp': 'Coordenação, cronogramas, acompanhamento de tarefas, arquivos e apoio à entrega externa.',
      'team.sahitya.tip': 'Coordena atribuições, cronogramas, arquivos, acompanhamento da equipe e entrega externa.',
      'team.saja.role': 'Diretora de Serviços Protéticos',
      'team.saja.exp': 'Revisão protética clínica, viabilidade de reabilitação, segurança do usuário e retorno sobre o ajuste do dispositivo.',
      'team.saja.tip': 'Fornece retorno protético, de reabilitação e de viabilidade clínica.',
      'team.ana.role': 'Diretora Financeira',
      'team.ana.exp': 'Controle orçamentário, prontidão para captação, controles financeiros e documentação para patrocinadores.',
      'team.ana.tip': 'Apoia o controle orçamentário, a prontidão para captação e a documentação financeira.',
      'team.maria.role': 'Líder de Parcerias Universitárias',
      'team.maria.exp': 'Colaboração universitária, coordenação de estudantes, comunicação com parceiros e entrega de arquivos.',
      'team.maria.tip': 'Apoia a colaboração universitária, a comunicação com parceiros e a entrega dos estudantes.',

      /* ---------------------------------------------------------- updates */
      'updates.heading': 'Últimas atualizações',
      'updates.current': 'Atual',
      'updates.next': 'Próximo',
      'updates.link': 'Link',
      'updates.prev': 'Atualização anterior',
      'updates.nextBtn': 'Próxima atualização',

      'upd.survey.title': 'Atualizações da pesquisa',
      'upd.survey.current': 'Coletando retorno de Alex Low.',
      'upd.survey.next': 'Enviar a 2 usuários de próteses para retorno inicial.',
      'upd.survey.cta': 'Ver pesquisa',
      'upd.deck.title': 'Apresentação para a UTFPR',
      'upd.deck.current': 'Preparar a apresentação para parceiros e revisão externa.',
      'upd.deck.next': 'Incluir escopo final, pedido da bancada de testes e instruções de entrega de arquivos.',
      'upd.deck.cta': 'Apresentação UTFPR',
      'upd.base.title': 'Projeto base pronto para impressão',
      'upd.base.current': 'O projeto base no estilo WAACS / e-NABLE é a base imprimível inicial.',
      'upd.base.next': 'Anexar link de impressão, notas de material e preço estimado.',
      'upd.base.cta': 'Anexar links / preço',
      'upd.hybrid.title': 'Manter abertura a métodos híbridos',
      'upd.hybrid.current': 'Orientação do protesista do OPRC: manter as opções de projeto abertas e evitar decisões precoces.',
      'upd.hybrid.next': 'Comparar abordagens híbridas quanto a simplicidade, reparabilidade e uso infantil.',
      'upd.hybrid.cta': 'Notas',

      /* -------------------------------------------------------- documents */
      'docs.heading': 'Documentos',
      'docs.open': 'Abrir',
      'docs.req.title': 'Requisitos de projeto',
      'docs.req.body': 'Responsáveis: Ganesh, Rasna, Abhay, Nili.',
      'docs.survey.title': 'Pesquisas',
      'docs.survey.body': 'Abrir a pesquisa com usuários de próteses e os arquivos de retorno.',
      'docs.budget.title': 'Orçamento',
      'docs.budget.body': 'Abrir a aprovação de orçamento e o rastreador de captação.',
      'docs.bench.title': 'Pacote da bancada de testes',
      'docs.bench.body': 'Abra a aba de colaboração universitária para a referência de montagem da bancada e o pacote de entrega.',
      'docs.tracker.title': 'Rastreador de requisitos',
      'docs.tracker.body': 'Abrir o rastreador de requisitos de projeto e as notas de status.',
      'docs.visuals.title': 'Referências visuais',
      'docs.visuals.body': 'Abrir as referências visuais na seção de Metas.',

      /* ------------------------------------------------------------- goal */
      'goal.title': 'Direção de projeto',
      'goal.owner': 'Responsável: Rasna Mantha',
      'goal.edit': 'Editar marcos',
      'goal.week': 'Esta semana',
      'goal.month': 'Este mês',
      'goal.year': 'O ano',
      'goal.weekSummary': 'Esta semana: confirmar o caminho de retorno da pesquisa e preparar a entrega da bancada de testes.',
      'goal.monthSummary': 'Este mês: fechar o pacote de requisitos de projeto, confirmar a revisão da pesquisa e definir o que os estudantes devem construir primeiro.',
      'goal.yearSummary': 'Clique nos pontos verde-limão dos marcos para ver a referência visual. As imagens são apenas referências.',
      'goal.hint': '● ponto verde-limão = clique para ver a referência visual',
      'goal.milestone': 'Marco',
      'goal.survey': 'Pesquisa',
      'goal.budget': 'Orçamento',

      /* -------------------------------------------------------- resources */
      'res.playbooks': 'Manuais',
      'res.sops': 'POPs',
      'res.links': 'Links',
      'res.presentations': 'Apresentações',
      'res.addLink': 'Adicionar link',
      'res.open': 'Abrir',
      'res.rd.title': 'Manual de P&D',
      'res.rd.body': 'Espaço reservado para o processo da equipe e as regras de decisão.',
      'res.testing.title': 'Manual de Testes',
      'res.testing.body': 'Espaço reservado para configuração de testes, registro e método de revisão.',
      'res.intake.title': 'POP de Entrada de Projeto',
      'res.intake.body': 'Solicitação de conceito, CAD e trabalho de projeto.',
      'res.upload.title': 'POP de Envio de Documentos',
      'res.upload.body': 'Processo de nomeação, versionamento e entrega.',
      'res.software.title': 'Software do Projeto',
      'res.software.body': 'Espaço reservado para o software de gestão de projetos.',
      'res.drive.title': 'Pasta do Drive',
      'res.drive.body': 'Pasta principal do Google Drive. Compartilhada apenas com contas universallimbs.com.',
      'res.utfpr.title': 'Apresentação UTFPR',
      'res.utfpr.body': 'Apresentação voltada aos parceiros.',
      'res.overview.title': 'Apresentação Geral do Projeto',
      'res.overview.body': 'Espaço reservado para a apresentação geral de P&D.',

      /* ----------------------------------------------------------- portal */
      'portal.submit': 'Enviar entregável',
      'portal.flowTip': 'Colaboração universitária → Enviar entregável → As informações e o arquivo são registrados → O revisor recebe um e-mail → A UL revisa → O arquivo aprovado vai para o Drive compartilhado → O Aquido é atualizado → O próximo responsável continua.',
      'portal.deck': 'Apresentação da colaboração universitária',
      'portal.processFlow': 'Fluxo do processo',
      'portal.rigTitle': 'Arquitetura da bancada de testes automatizada',
      'portal.rigAlt': 'Arquitetura da bancada de testes automatizada',
      'portal.hoverHelp': 'Passe o cursor ou clique em um número para ver o detalhe da peça.',
      'portal.parts': 'Peças identificadas',
      'portal.system': 'Visão geral do sistema',

      'part.motor': 'Motor linear',
      'part.motor.d': 'Fornece movimento linear controlado.',
      'part.cableCell': 'Célula de carga do cabo',
      'part.cableCell.d': 'Mede a tensão no cabo.',
      'part.bowden': 'Cabo Bowden / entrada do tendão',
      'part.bowden.d': 'Transfere a força para a mão.',
      'part.bed': 'Base fixa',
      'part.bed.d': 'Base rígida que mantém o suporte no lugar.',
      'part.wrist': 'Suporte de punho',
      'part.wrist.d': 'Fixa a mão impressa em 3D.',
      'part.hand': 'Mão impressa em 3D',
      'part.hand.d': 'Dispositivo sob teste.',
      'part.gripCell': 'Célula de carga do alvo de preensão',
      'part.gripCell.d': 'Mede a força de preensão aplicada pela mão.',
      'part.daq': 'Controlador DAQ',
      'part.daq.d': 'Coleta dados dos sensores e motores.',
      'part.python': 'Interface em Python',
      'part.python.d': 'Gráficos, controle e registro de dados.',
      'part.actuator': 'Atuador linear',
      'part.tendon': 'Cabo Bowden / tendão',
      'part.daqLog': 'DAQ + registro Python',

      'brief.heading': 'Briefing de construção para estudantes',
      'brief.goal': 'Objetivo do projeto',
      'brief.goal.d': 'Projetar e validar uma bancada de testes compacta para mãos protéticas impressas em 3D, capaz de medir transferência de força, carga no cabo e desempenho de preensão sob condições repetíveis.',
      'brief.concept': 'Conceito central',
      'brief.concept.d': 'A bancada aplica uma tração controlada no cabo, mede a força de entrada e saída com células de carga e registra os dados para avaliação repetível de fadiga, desgaste e escorregamento.',
      'brief.hardware': 'Hardware flexível',
      'brief.hardware.d': 'As equipes podem usar motores, drivers, sensores e fixações equivalentes conforme custo, disponibilidade e experiência. O objetivo é alcançar fidelidade de teste semelhante com um sistema prático e construível.',
      'brief.themes': 'Temas de avaliação',
      'brief.themes.d': 'Os principais temas de teste incluem transferência de força, fadiga cíclica, retenção de preensão, resistência ao escorregamento, fluência e desgaste ambiental sob carga repetida.',

      /* -------------------------------------------------------- downloads */
      'dl.title': 'Downloads',
      'dl.owner': 'Pacotes de referência para equipes universitárias — baixe, construa e depois relate.',
      'dl.submit': 'Enviar resposta do projeto',
      'dl.tip': 'Cada download espera uma resposta. Baixe o pacote → construa ou revise → envie uma resposta de projeto para que a UL saiba o status, os achados e o que você precisa a seguir.',
      'dl.available': 'Pacotes disponíveis',
      'dl.download': 'Baixar',
      'dl.open': 'Abrir',
      'dl.respond': 'Enviar resposta',
      'dl.responses': 'Respostas do projeto',
      'dl.colPackage': 'Pacote',
      'dl.colTeam': 'Equipe',
      'dl.colDate': 'Última resposta',
      'dl.colStatus': 'Status',
      'dl.empty': 'Nenhuma resposta enviada deste dispositivo ainda.',
      'dl.note': 'As respostas enviadas deste dispositivo aparecem aqui imediatamente. A cópia do revisor é registrada centralmente e enviada por e-mail à equipe de P&D.',

      'dl.bench.title': 'Pacote da arquitetura da bancada de testes',
      'dl.bench.body': 'Diagrama completo da arquitetura, lista de peças identificadas e o briefing de construção para a bancada de testes de força.',
      'dl.bench.tag': 'Briefing',
      'dl.bench.m1': 'WEBP + briefing',
      'dl.bench.m2': 'Prioridade 1',
      'dl.base.title': 'Projeto base da mão imprimível',
      'dl.base.body': 'A geometria base no estilo WAACS / e-NABLE de onde parte o MVP. Use como referência imprimível antes de propor mudanças.',
      'dl.base.tag': 'Base CAD',
      'dl.base.m1': 'Imagem de referência',
      'dl.base.m2': 'Prioridade 1',
      'dl.tracker.title': 'Rastreador de requisitos de projeto',
      'dl.tracker.body': 'Lista viva de requisitos com responsáveis e status. Leia antes de começar para que seu trabalho corresponda a um requisito existente.',
      'dl.tracker.tag': 'Planilha',
      'dl.tracker.m1': 'Google Sheets',
      'dl.tracker.m2': 'Leia primeiro',
      'dl.survey.title': 'Pesquisa com usuários de próteses',
      'dl.survey.body': 'O instrumento de pesquisa por trás dos requisitos de projeto. Aplique localmente com participantes que consentirem e relate seus achados.',
      'dl.survey.tag': 'Pesquisa',
      'dl.survey.m1': 'Formulário web',
      'dl.survey.m2': 'Requer ética',
      'dl.deck.title': 'Apresentação da colaboração universitária',
      'dl.deck.body': 'Escopo, expectativas e o processo de entrega para universidades parceiras. Comece por aqui se você é novo no programa.',
      'dl.deck.tag': 'Apresentação',
      'dl.deck.m1': 'Canva',
      'dl.deck.m2': 'Comece aqui',
      'dl.visuals.title': 'Conjunto de referências visuais',
      'dl.visuals.body': 'Referências dos marcos Yale multigrasp e SoftFoot Pro. Apenas inspiração — não copie o mecanismo diretamente.',
      'dl.visuals.tag': 'Visuais',
      'dl.visuals.m1': 'PNG / JPG',
      'dl.visuals.m2': 'Inspiração',

      /* ------------------------------------------------------------ forms */
      'form.close': 'Fechar',
      'form.deliverable': 'Enviar entregável',
      'form.name': 'Seu nome',
      'form.email': 'Seu e-mail',
      'form.emailHelp': 'O revisor responde para este endereço.',
      'form.emailPlaceholder': 'voce@universidade.edu',
      'form.org': 'Universidade / organização',
      'form.task': 'Nome da tarefa',
      'form.what': 'O que você está enviando?',
      'form.choose': 'Escolha',
      'form.concept': 'Conceito',
      'form.working': 'Arquivo de trabalho',
      'form.final': 'Arquivo final',
      'form.research': 'Resultado de pesquisa ou validação',
      'form.other': 'Outro',
      'form.version': 'Versão',
      'form.versionPlaceholder': 'Por exemplo: v1.2',
      'form.changed': 'O que mudou?',
      'form.reviewer': 'Enviar ao revisor',
      'form.selectReviewer': 'Selecione um revisor',
      'form.otherReviewer': 'E-mail de outro revisor',
      'form.nextSteps': 'Próximos passos esperados',
      'form.review': 'Revisão',
      'form.revision': 'Revisão necessária',
      'form.approve': 'Aprovar',
      'form.testing': 'Testes',
      'form.upload': 'Envie o arquivo do entregável',
      'form.uploadHelp': 'Envie o arquivo de trabalho ou final para revisão da UL. Máximo de 10 MB.',
      'form.notes': 'Observações',
      'form.send': 'Enviar entregável',

      'form.response': 'Resposta do projeto',
      'form.package': 'Sobre qual download é esta resposta?',
      'form.choosePackage': 'Escolha um pacote',
      'form.team': 'Universidade / equipe',
      'form.status': 'Status',
      'form.statusNotStarted': 'Baixado — não iniciado',
      'form.statusProgress': 'Em andamento',
      'form.statusDone': 'Concluído',
      'form.statusBlocked': 'Bloqueado',
      'form.statusStopped': 'Não prosseguirá',
      'form.workDone': 'O que você fez com ele?',
      'form.workDonePlaceholder': 'O que você construiu, testou, revisou ou alterou.',
      'form.findings': 'Achados ou problemas',
      'form.findingsPlaceholder': 'O que funcionou, o que não funcionou e o que bloqueou você.',
      'form.needs': 'O que você precisa da UL a seguir?',
      'form.needsPlaceholder': 'Arquivos, decisões, revisão ou uma reunião.',
      'form.supportFile': 'Arquivo de apoio (opcional)',
      'form.supportHelp': 'Fotos, registros de dados, CAD ou um relatório curto. Máximo de 10 MB.',
      'form.sendResponse': 'Enviar resposta',
      'form.teamReplies': 'A equipe de P&D responde para este endereço.',

      'form.editMilestones': 'Editar marcos',
      'form.addMilestone': 'Adicionar marco',
      'form.saveChanges': 'Salvar alterações',
      'form.label': 'Rótulo',
      'form.range': 'Período',
      'form.titleField': 'Título',
      'form.visualTitle': 'Título da imagem',
      'form.image': 'Imagem',
      'form.visualText': 'Texto da imagem',
      'form.weekStart': 'Início (semana)',
      'form.weekEnd': 'Fim (semana)',
      'form.monthStart': 'Início (mês)',
      'form.monthEnd': 'Fim (mês)',
      'form.yearStart': 'Início (ano)',
      'form.yearEnd': 'Fim (ano)',
      'form.visual': 'Imagem',

      /* --------------------------------------------------------- statuses */
      'msg.notConfigured': 'Os envios ainda não foram configurados. Defina submissionEndpoint em assets/js/config.js.',
      'msg.chooseFile': 'Escolha um arquivo de entregável para continuar.',
      'msg.tooLarge': 'O arquivo selecionado é maior que o limite de 10 MB.',
      'msg.sending': 'Enviando entregável...',
      'msg.sendingResponse': 'Enviando resposta...',
      'msg.sent': 'Entregável enviado. O revisor foi notificado por e-mail e você receberá um comprovante.',
      'msg.responseSent': 'Resposta registrada. A equipe de P&D foi notificada.',

      /* ----------------------------------------------------------- footer */
      'footer.text': 'os comentários ficam visíveis em todas as páginas',
      'footer.link': 'enviar comentários',

      /* --------------------------------------------------- timeline heads */
      'tl.milestone': 'Marco',
      'tl.mon': 'Seg', 'tl.tue': 'Ter', 'tl.wed': 'Qua', 'tl.thu': 'Qui',
      'tl.fri': 'Sex', 'tl.sat': 'Sáb', 'tl.sun': 'Dom',
      'tl.w1': 'S1', 'tl.w2': 'S2', 'tl.w3': 'S3', 'tl.w4': 'S4', 'tl.w5': 'S5',
      'tl.aug': 'Ago', 'tl.sep': 'Set', 'tl.oct': 'Out', 'tl.nov': 'Nov',
      'tl.dec': 'Dez', 'tl.jan': 'Jan', 'tl.feb': 'Fev', 'tl.mar': 'Mar',
      'tl.apr': 'Abr', 'tl.may': 'Mai', 'tl.jun': 'Jun', 'tl.jul': 'Jul',

      'ms.1.label': 'Marco 1',
      'ms.1.range': 'Ago—Nov 2026',
      'ms.1.title': 'Multipreensão simplificada da mão Yale',
      'ms.1.visualTitle': 'Marco 1 · Mão Yale',
      'ms.1.visualText': 'Apenas inspiração. Estudar os modos de preensão e simplificar a estratégia mecânica do MVP.',
      'ms.2.label': 'Marco 2',
      'ms.2.range': 'Dez 2026—Mar 2027',
      'ms.2.title': 'Integrar a geometria do SoftFoot Pro',
      'ms.2.visualTitle': 'Marco 2 · SoftFoot Pro',
      'ms.2.visualText': 'Apenas inspiração. Traduzir a geometria adaptativa passiva somente se tornar a mão mais simples e mais útil.',
      'ms.3.label': 'Marco 3',
      'ms.3.range': 'Abr—Jul 2027',
      'ms.3.title': 'Recurso externo de energia mecânica',
      'ms.3.visualTitle': 'Marco 3 · Energia Mecânica',
      'ms.3.visualText': 'Imagem provisória. Explorar apenas assistência de energia puramente mecânica.'
    }
  };

  let current = DEFAULT;

  function dict() { return STRINGS[current] || STRINGS[DEFAULT]; }

  /** Returns the string for `key`, falling back to English, then the key itself. */
  function t(key) {
    const table = dict();
    if (Object.prototype.hasOwnProperty.call(table, key)) return table[key];
    if (Object.prototype.hasOwnProperty.call(STRINGS[DEFAULT], key)) return STRINGS[DEFAULT][key];
    return key;
  }

  /** Rewrites every marked node in `root` into the active language. */
  function apply(root) {
    const scope = root || document;

    scope.querySelectorAll('[data-i18n]').forEach(function (el) {
      el.textContent = t(el.getAttribute('data-i18n'));
    });

    // innerHTML only ever receives strings authored in this file.
    scope.querySelectorAll('[data-i18n-html]').forEach(function (el) {
      el.innerHTML = t(el.getAttribute('data-i18n-html'));
    });

    scope.querySelectorAll('[data-i18n-attr]').forEach(function (el) {
      el.getAttribute('data-i18n-attr').split(';').forEach(function (pair) {
        const parts = pair.split(':');
        if (parts.length !== 2) return;
        const attr = parts[0].trim();
        const key = parts[1].trim();
        if (attr && key) el.setAttribute(attr, t(key));
      });
    });

    if (scope === document) {
      document.documentElement.lang = current === 'pt' ? 'pt-BR' : 'en';
      const title = document.querySelector('title');
      if (title) title.textContent = t('doc.title');
    }
  }

  function setLanguage(lang, silent) {
    current = STRINGS[lang] ? lang : DEFAULT;
    try { localStorage.setItem(STORE_KEY, current); } catch (error) { /* private mode */ }

    document.querySelectorAll('.lang-btn').forEach(function (button) {
      const on = button.dataset.lang === current;
      button.classList.toggle('active', on);
      button.setAttribute('aria-pressed', on ? 'true' : 'false');
    });

    apply(document);

    // Let the app re-render anything it builds in JS (timeline, tables).
    if (!silent) document.dispatchEvent(new CustomEvent('ulf:languagechange', { detail: { lang: current } }));
  }

  function stored() {
    try {
      const saved = localStorage.getItem(STORE_KEY);
      if (saved && STRINGS[saved]) return saved;
    } catch (error) { /* private mode */ }
    return (navigator.language || '').toLowerCase().indexOf('pt') === 0 ? 'pt' : DEFAULT;
  }

  /**
   * Merges extra strings in, so a page with its own vocabulary (the survey) can
   * ship them separately instead of bloating this file. Call before init().
   */
  function extend(tables) {
    Object.keys(tables || {}).forEach(function (lang) {
      if (!STRINGS[lang]) STRINGS[lang] = {};
      Object.assign(STRINGS[lang], tables[lang]);
    });
  }

  window.ulfI18n = {
    t: t,
    apply: apply,
    extend: extend,
    set: setLanguage,
    get current() { return current; },
    init: function () {
      setLanguage(stored(), true);
      document.querySelectorAll('.lang-btn').forEach(function (button) {
        button.addEventListener('click', function () { setLanguage(button.dataset.lang); });
      });
    }
  };
}());
