(function(){
const CM=window.CM;
CM.nav.route('help',m=>{
 m.innerHTML=`<h1>Ajuda</h1><p class="sub">Como usar o CifraMix no computador e no celular.</p>
 <div class="card help"><h3>Montar e tocar um pot-pourri</h3><ol>
 <li><b>Pesquisar</b> → <b>Cadastrar música</b>: digite ou cole letra e cifra (acorde numa linha, letra na linha de baixo) e, se quiser, informe o tom.</li>
 <li><b>Biblioteca</b> → <b>Novo pot-pourri</b>: adicione músicas, arraste pela alça ⠿ (ou use ▲▼), ajuste o tom de cada uma e escreva observações.</li>
 <li><b>Tocar pot-pourri</b>: todas as cifras em uma página. Use <b>Iniciar</b> para rolar sozinho e <b>Modo palco</b> para tocar ao vivo.</li></ol></div>
 <div class="card help"><h3>Atalhos de teclado</h3><p>Espaço pausa/continua · ↑ ↓ velocidade · → ← próxima/anterior · Esc sai do modo palco.</p></div>
 <div class="card help"><h3>Backup dos repertórios</h3><p>Os dados ficam só neste navegador. Em <b>Biblioteca → Exportar JSON</b> você baixa um arquivo com todas as músicas e pot-pourris. Guarde-o no Drive, e-mail ou pen drive. Para restaurar, ou levar para outro aparelho, use <b>Importar JSON</b>. Limpar os dados do navegador apaga tudo, então exporte de vez em quando.</p></div>
 <div class="card help"><h3>Instalar como aplicativo</h3><p><b>Computador (Chrome/Edge):</b> abra pelo endereço <code>http://localhost:8080</code> (use o arquivo <code>Iniciar-CifraMix.bat</code>) ou pelo endereço do site e clique no ícone de instalar na barra de endereço.<br><b>Android (Chrome):</b> menu ⋮ → <b>Instalar app</b>.<br><b>iPhone (Safari):</b> Compartilhar → <b>Adicionar à Tela de Início</b>.<br>A instalação no celular exige o app publicado em um endereço https (veja o LEIA-ME).</p></div>`;
});
})();
