// Prosthetic user survey — English / Brazilian Portuguese strings.
//
// Classic script (not a module). Load order in the page head:
//   config.js, submit.js, i18n.js, i18n-survey.js
// It registers its table with the shared engine at parse time, so every key is
// present before the page calls window.ulfI18n.init().
//
// TRANSLATION RULE FOR THIS FILE
//   Only the *visible* text is translated. Every `name=` attribute and every
//   `value=` attribute in prosthetic-user-survey.html stays in English, because
//   those become the Google Sheet column headers and cell values. Adding a
//   Portuguese label here never changes what is stored.
//
// Portuguese is pt-BR: the first partner university is UTFPR in Curitiba.

(function () {
  'use strict';

  if (!window.ulfI18n || typeof window.ulfI18n.extend !== 'function') {
    console.error('i18n-survey.js: load assets/js/i18n.js before this file.');
    return;
  }

  window.ulfI18n.extend({
    en: {
      /* ------------------------------------------------------------ chrome */
      // Overrides the dashboard title for this standalone page.
      'doc.title': 'Prosthetic User Survey | Universal Limbs',
      'sv.logoAlt': 'Universal Limbs logo',
      'sv.h1': 'Prosthetic User Survey',
      'sv.intro': 'This survey will help us design better, low-cost, body-powered upper-limb prosthetic devices.',

      /* ------------------------------------------------------ consent gate */
      'sv.notice.title': 'Before you start',
      'sv.notice.body': 'This survey is voluntary and anonymous — we do not collect your name or any identifying information unless you choose to share it. Your answers will only be used by Universal Limbs Foundation, a non-profit, to guide the design of an open-source pediatric prosthetic hand. Answers may be shared in aggregate (never individually) with our engineering and research partners. You can skip any question or stop at any time. This is not a medical service and does not replace advice from a clinician.',
      'sv.consent': 'I understand how my information will be used and I agree to take part in this survey.',

      /* ----------------------------------------------------------- legends */
      'sv.s1': '1. Basic Information',
      'sv.s2': '2. Current Prosthetic Use',
      'sv.s3': '3. Cost & Decision-Making',
      'sv.s4': '4. Reasons for Use or Non-Use',
      'sv.s5': '5. Comfort and Fit',
      'sv.s6': '6. Function and Daily Use',
      'sv.s7': '7. Appearance and Confidence',
      'sv.s8': '8. Durability and Maintenance',
      'sv.s9': '9. What Matters Most',

      /* --------------------------------------------------------- questions */
      'sv.q.ageRange': 'What is your age range?',
      'sv.q.affectedArm': 'Which arm is affected?',
      'sv.q.transradial': 'Is your amputation below the elbow / transradial?',
      'sv.q.amputationDuration': 'How long have you had your amputation?',
      'sv.q.region': 'What country or region do you live in?',

      'sv.q.currentlyUses': 'Do you currently use a prosthetic?',
      'sv.q.prostheticType': 'What type do you use?',
      'sv.q.controlEase': 'How easy is it to control movements with the prosthetic?',
      'sv.q.useFrequency': 'How often do you use it?',
      'sv.q.useLocation': 'Where do you use it most?',

      'sv.q.paymentSource': 'How was your current prosthetic (or previous devices) paid for?',
      'sv.q.affordableAmount': 'Roughly how much could your family realistically afford to pay for a prosthetic hand (one-time cost)?',
      'sv.q.biggestBarrier': 'What is the single biggest barrier to getting (or keeping) a prosthetic?',

      'sv.q.likes': 'If you use your prosthetic, what do you like about it?',
      'sv.q.whyNotOften': 'If you do not use it often, why not?',
      'sv.q.stopReason': 'What is one reason you would stop using your prosthetic entirely?',

      'sv.q.comfort': 'How comfortable is your current prosthetic?',
      'sv.q.socketIssues': 'Does the socket cause any of the following? (select all that apply)',
      'sv.q.discomfortTiming': 'If yes, when does the discomfort occur?',
      'sv.q.comfortImprovement': 'What would make the socket more comfortable?',
      'sv.q.donning': 'Are you able to put on/remove your prosthetic without assistance?',
      'sv.q.donningTime': 'How long does it take you to put on or take off your prosthetic?',

      'sv.q.activities': 'Which daily activities do you want the most help with? (select all that apply)',

      'sv.q.appearanceImportance': 'How important is the appearance of the prosthetic to you?',
      'sv.q.appearancePreference': 'Which type of prosthetic do you prefer?',

      'sv.q.everBroke': 'Has your prosthetic ever broken?',
      'sv.q.partBroke': 'What part broke first?',
      'sv.q.repairEase': 'How easy is it to repair or adjust?',

      'sv.q.rank': 'Pick your top 3 factors when deciding whether to get, or keep using, a prosthetic — ranked 1st to 3rd.',

      /* ------------------------------------------------- shared option text */
      'sv.opt.preferNot': 'Prefer not to say',
      'sv.opt.yes': 'Yes',
      'sv.opt.no': 'No',
      'sv.opt.other': 'Other',

      /* affectedArm */
      'sv.opt.arm.left': 'Left',
      'sv.opt.arm.right': 'Right',
      'sv.opt.arm.both': 'Both',

      /* prostheticType */
      'sv.opt.type.cosmetic': 'Cosmetic',
      'sv.opt.type.bodyPowered': 'Body-powered',
      'sv.opt.type.myoelectric': 'Myoelectric',
      'sv.opt.type.printed': '3D-printed',

      /* useFrequency */
      'sv.opt.freq.daily': 'Daily',
      'sv.opt.freq.weekly': 'Weekly',
      'sv.opt.freq.occasionally': 'Occasionally',
      'sv.opt.freq.rarely': 'Rarely',
      'sv.opt.freq.never': 'Never',

      /* useLocation */
      'sv.opt.where.home': 'Home',
      'sv.opt.where.work': 'Work',
      'sv.opt.where.public': 'Public / social settings',
      'sv.opt.where.specific': 'Specific activities only',

      /* paymentSource */
      'sv.opt.pay.free': 'Free / donated',
      'sv.opt.pay.government': 'Government or public healthcare',
      'sv.opt.pay.insurance': 'Insurance',
      'sv.opt.pay.pocket': 'Paid out of pocket',
      'sv.opt.pay.ngo': 'NGO / charity',

      /* biggestBarrier */
      'sv.opt.barrier.cost': 'Cost',
      'sv.opt.barrier.access': 'Access to a clinic/provider',
      'sv.opt.barrier.awareness': 'Awareness that options exist',
      'sv.opt.barrier.fit': 'Fit / comfort concerns',
      'sv.opt.barrier.appearance': 'Appearance concerns',

      /* socketIssues */
      'sv.opt.socket.pressure': 'Pressure',
      'sv.opt.socket.pain': 'Pain',
      'sv.opt.socket.sweating': 'Sweating',
      'sv.opt.socket.slipping': 'Slipping',
      'sv.opt.socket.irritation': 'Skin irritation',
      'sv.opt.socket.none': 'None of these',

      /* discomfortTiming */
      'sv.opt.timing.continuous': 'Continuously',
      'sv.opt.timing.activity': 'Only during a certain activity',

      /* donning */
      'sv.opt.donning.independent': 'Yes, independently',
      'sv.opt.donning.someHelp': 'With some help',
      'sv.opt.donning.assisted': 'No, needs assistance',

      /* activities */
      'sv.opt.act.eating': 'Eating',
      'sv.opt.act.drinking': 'Drinking',
      'sv.opt.act.phone': 'Phone use',
      'sv.opt.act.writing': 'Writing / typing',
      'sv.opt.act.carrying': 'Carrying objects',
      'sv.opt.act.doors': 'Opening doors',
      'sv.opt.act.dressing': 'Dressing',
      'sv.opt.act.cooking': 'Cooking',
      'sv.opt.act.schoolWork': 'School / work tasks',
      'sv.opt.act.sports': 'Sports',
      'sv.opt.act.hobbies': 'Hobbies',

      /* appearancePreference */
      'sv.opt.look.realistic': 'Realistic-looking',
      'sv.opt.look.robotic': 'Functional / robotic-looking',
      'sv.opt.look.custom': 'Custom design',

      /* ----------------------------------------------------- rating scales */
      'sv.scale.neutral': 'Neutral',
      'sv.scale.veryDifficult': 'Very difficult',
      'sv.scale.veryEasy': 'Very easy',
      'sv.scale.veryUncomfortable': 'Very uncomfortable',
      'sv.scale.veryComfortable': 'Very comfortable',
      'sv.scale.notImportant': 'Not important',
      'sv.scale.veryImportant': 'Very important',

      /* ------------------------------------------------------- rank block */
      'sv.rank.1': '1st',
      'sv.rank.2': '2nd',
      'sv.rank.3': '3rd',
      'sv.rank.choose': 'Choose a factor',

      'sv.factor.cost': 'Cost',
      'sv.factor.comfort': 'Comfort',
      'sv.factor.function': 'Function / usefulness',
      'sv.factor.appearance': 'Appearance',
      'sv.factor.durability': 'Durability',
      'sv.factor.donning': 'Ease of putting on/off',
      'sv.factor.repair': 'Availability of repair',
      'sv.factor.weight': 'Weight',

      /* -------------------------------------------------- submit + status */
      'sv.submit': 'Submit survey',
      'sv.msg.needConsent': 'Please confirm consent before submitting.',
      'sv.msg.rankDupes': 'Please choose three different ranked factors.',
      'sv.msg.sending': 'Submitting survey...',
      'sv.msg.thanks': 'Thank you. Your response has been submitted.',
      // Mirrors of the errors thrown by assets/js/submit.js.
      'sv.msg.offline': 'No connection to the submission service. Please check your network and try again.',
      'sv.msg.unreadable': 'The submission service returned an unreadable response. Please try again.',
      'sv.msg.notRecorded': 'The submission was not recorded. Please try again.'
    },

    pt: {
      /* ------------------------------------------------------------ chrome */
      'doc.title': 'Pesquisa com Usuários de Próteses | Universal Limbs',
      'sv.logoAlt': 'Logotipo da Universal Limbs',
      'sv.h1': 'Pesquisa com Usuários de Próteses',
      'sv.intro': 'Esta pesquisa vai nos ajudar a projetar próteses de membro superior acionadas pelo corpo, melhores e de baixo custo.',

      /* ------------------------------------------------------ consent gate */
      'sv.notice.title': 'Antes de começar',
      'sv.notice.body': 'Esta pesquisa é voluntária e anônima — não coletamos seu nome nem qualquer informação que identifique você, a menos que escolha compartilhá-la. Suas respostas serão usadas apenas pela Universal Limbs Foundation, uma organização sem fins lucrativos, para orientar o desenvolvimento de uma mão protética pediátrica de código aberto. As respostas podem ser compartilhadas de forma agregada (nunca individualmente) com nossos parceiros de engenharia e pesquisa. Você pode pular qualquer pergunta ou parar a qualquer momento. Este não é um serviço médico e não substitui a orientação de um profissional de saúde.',
      'sv.consent': 'Entendo como minhas informações serão usadas e concordo em participar desta pesquisa.',

      /* ----------------------------------------------------------- legends */
      'sv.s1': '1. Informações básicas',
      'sv.s2': '2. Uso atual de prótese',
      'sv.s3': '3. Custo e tomada de decisão',
      'sv.s4': '4. Motivos de uso ou não uso',
      'sv.s5': '5. Conforto e ajuste',
      'sv.s6': '6. Função e uso no dia a dia',
      'sv.s7': '7. Aparência e confiança',
      'sv.s8': '8. Durabilidade e manutenção',
      'sv.s9': '9. O que mais importa',

      /* --------------------------------------------------------- questions */
      'sv.q.ageRange': 'Qual é a sua faixa etária?',
      'sv.q.affectedArm': 'Qual braço é afetado?',
      'sv.q.transradial': 'Sua amputação é abaixo do cotovelo (transradial)?',
      'sv.q.amputationDuration': 'Há quanto tempo você tem a amputação?',
      'sv.q.region': 'Em que país ou região você mora?',

      'sv.q.currentlyUses': 'Você usa prótese atualmente?',
      'sv.q.prostheticType': 'Que tipo de prótese você usa?',
      'sv.q.controlEase': 'Quão fácil é controlar os movimentos com a prótese?',
      'sv.q.useFrequency': 'Com que frequência você usa a prótese?',
      'sv.q.useLocation': 'Onde você mais usa a prótese?',

      'sv.q.paymentSource': 'Como sua prótese atual (ou as anteriores) foi paga?',
      'sv.q.affordableAmount': 'Aproximadamente quanto sua família conseguiria pagar, de forma realista, por uma mão protética (valor único)?',
      'sv.q.biggestBarrier': 'Qual é a maior barreira para conseguir (ou manter) uma prótese?',

      'sv.q.likes': 'Se você usa sua prótese, do que você gosta nela?',
      'sv.q.whyNotOften': 'Se você não a usa com frequência, por quê?',
      'sv.q.stopReason': 'Qual seria um motivo para você parar de usar a prótese por completo?',

      'sv.q.comfort': 'Quão confortável é sua prótese atual?',
      'sv.q.socketIssues': 'O encaixe (soquete) causa algum destes problemas? (marque todas as opções aplicáveis)',
      'sv.q.discomfortTiming': 'Se sim, quando o desconforto acontece?',
      'sv.q.comfortImprovement': 'O que deixaria o encaixe mais confortável?',
      'sv.q.donning': 'Você consegue colocar e tirar a prótese sem ajuda?',
      'sv.q.donningTime': 'Quanto tempo você leva para colocar ou tirar a prótese?',

      'sv.q.activities': 'Em quais atividades do dia a dia você mais gostaria de ajuda? (marque todas as opções aplicáveis)',

      'sv.q.appearanceImportance': 'Qual é a importância da aparência da prótese para você?',
      'sv.q.appearancePreference': 'Que tipo de prótese você prefere?',

      'sv.q.everBroke': 'Sua prótese já quebrou?',
      'sv.q.partBroke': 'Qual peça quebrou primeiro?',
      'sv.q.repairEase': 'Quão fácil é consertar ou ajustar a prótese?',

      'sv.q.rank': 'Escolha os 3 fatores mais importantes na hora de decidir se vai conseguir, ou continuar usando, uma prótese — do 1º ao 3º lugar.',

      /* ------------------------------------------------- shared option text */
      'sv.opt.preferNot': 'Prefiro não responder',
      'sv.opt.yes': 'Sim',
      'sv.opt.no': 'Não',
      'sv.opt.other': 'Outro',

      /* affectedArm */
      'sv.opt.arm.left': 'Esquerdo',
      'sv.opt.arm.right': 'Direito',
      'sv.opt.arm.both': 'Ambos',

      /* prostheticType */
      'sv.opt.type.cosmetic': 'Estética',
      'sv.opt.type.bodyPowered': 'Acionada pelo corpo',
      'sv.opt.type.myoelectric': 'Mioelétrica',
      'sv.opt.type.printed': 'Impressa em 3D',

      /* useFrequency */
      'sv.opt.freq.daily': 'Todos os dias',
      'sv.opt.freq.weekly': 'Toda semana',
      'sv.opt.freq.occasionally': 'De vez em quando',
      'sv.opt.freq.rarely': 'Raramente',
      'sv.opt.freq.never': 'Nunca',

      /* useLocation */
      'sv.opt.where.home': 'Em casa',
      'sv.opt.where.work': 'No trabalho',
      'sv.opt.where.public': 'Em locais públicos / sociais',
      'sv.opt.where.specific': 'Apenas em atividades específicas',

      /* paymentSource */
      'sv.opt.pay.free': 'Gratuita / doada',
      'sv.opt.pay.government': 'Governo ou saúde pública',
      'sv.opt.pay.insurance': 'Plano de saúde ou seguro',
      'sv.opt.pay.pocket': 'Paga do próprio bolso',
      'sv.opt.pay.ngo': 'ONG / instituição de caridade',

      /* biggestBarrier */
      'sv.opt.barrier.cost': 'Custo',
      'sv.opt.barrier.access': 'Acesso a uma clínica ou profissional',
      'sv.opt.barrier.awareness': 'Saber que existem opções',
      'sv.opt.barrier.fit': 'Preocupação com ajuste / conforto',
      'sv.opt.barrier.appearance': 'Preocupação com a aparência',

      /* socketIssues */
      'sv.opt.socket.pressure': 'Pressão',
      'sv.opt.socket.pain': 'Dor',
      'sv.opt.socket.sweating': 'Suor',
      'sv.opt.socket.slipping': 'Escorregamento',
      'sv.opt.socket.irritation': 'Irritação na pele',
      'sv.opt.socket.none': 'Nenhum destes',

      /* discomfortTiming */
      'sv.opt.timing.continuous': 'O tempo todo',
      'sv.opt.timing.activity': 'Apenas durante alguma atividade',

      /* donning */
      'sv.opt.donning.independent': 'Sim, sozinho(a)',
      'sv.opt.donning.someHelp': 'Com alguma ajuda',
      'sv.opt.donning.assisted': 'Não, preciso de ajuda',

      /* activities */
      'sv.opt.act.eating': 'Comer',
      'sv.opt.act.drinking': 'Beber',
      'sv.opt.act.phone': 'Usar o celular',
      'sv.opt.act.writing': 'Escrever / digitar',
      'sv.opt.act.carrying': 'Carregar objetos',
      'sv.opt.act.doors': 'Abrir portas',
      'sv.opt.act.dressing': 'Vestir-se',
      'sv.opt.act.cooking': 'Cozinhar',
      'sv.opt.act.schoolWork': 'Tarefas da escola / do trabalho',
      'sv.opt.act.sports': 'Esportes',
      'sv.opt.act.hobbies': 'Hobbies',

      /* appearancePreference */
      'sv.opt.look.realistic': 'Com aparência realista',
      'sv.opt.look.robotic': 'Funcional / com visual robótico',
      'sv.opt.look.custom': 'Design personalizado',

      /* ----------------------------------------------------- rating scales */
      'sv.scale.neutral': 'Neutro',
      'sv.scale.veryDifficult': 'Muito difícil',
      'sv.scale.veryEasy': 'Muito fácil',
      'sv.scale.veryUncomfortable': 'Muito desconfortável',
      'sv.scale.veryComfortable': 'Muito confortável',
      'sv.scale.notImportant': 'Nada importante',
      'sv.scale.veryImportant': 'Muito importante',

      /* ------------------------------------------------------- rank block */
      'sv.rank.1': '1º',
      'sv.rank.2': '2º',
      'sv.rank.3': '3º',
      'sv.rank.choose': 'Escolha um fator',

      'sv.factor.cost': 'Custo',
      'sv.factor.comfort': 'Conforto',
      'sv.factor.function': 'Função / utilidade',
      'sv.factor.appearance': 'Aparência',
      'sv.factor.durability': 'Durabilidade',
      'sv.factor.donning': 'Facilidade para colocar e tirar',
      'sv.factor.repair': 'Disponibilidade de conserto',
      'sv.factor.weight': 'Peso',

      /* -------------------------------------------------- submit + status */
      'sv.submit': 'Enviar pesquisa',
      'sv.msg.needConsent': 'Confirme o consentimento antes de enviar.',
      'sv.msg.rankDupes': 'Escolha três fatores diferentes na classificação.',
      'sv.msg.sending': 'Enviando a pesquisa...',
      'sv.msg.thanks': 'Obrigado. Sua resposta foi enviada.',
      'sv.msg.offline': 'Sem conexão com o serviço de envio. Verifique sua rede e tente novamente.',
      'sv.msg.unreadable': 'O serviço de envio retornou uma resposta ilegível. Tente novamente.',
      'sv.msg.notRecorded': 'O envio não foi registrado. Tente novamente.'
    }
  });
}());
