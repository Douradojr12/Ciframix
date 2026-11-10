(function(){
const CM=window.CM;
CM.nav.route('help',m=>{
 m.innerHTML=`<h1>Ajuda</h1><p class="sub">Como usar o CifraMix no computador e no celular.</p>
 <div class="card help"><h3>Pesquisar músicas e colocar a cifra</h3><ol>
 <li><b>Pesquisar</b>: digite o nome da música ou do artista. Além da sua biblioteca, o app consulta um catálogo online (Apple e MusicBrainz) e mostra título, artista, álbum e capa.</li>
 <li>Clique em <b>Procurar cifra ↗</b> (abre a busca em outra aba), copie a cifra do site que você usa e volte.</li>
 <li><b>Adicionar com cifra</b> → <b>Colar da área de transferência</b>. O app limpa o texto, acha o tom e salva na biblioteca.</li></ol>
 <p>O app não baixa cifras sozinho: não existe API pública autorizada. Use cifras suas ou que você tenha permissão de usar. Para não enviar nada à internet, desmarque <b>Pesquisar também no catálogo online</b>.</p></div>
 <div class="card help"><h3>Montar e tocar um pot-pourri</h3><ol>
 <li>Música sem cifra: <b>Pesquisar</b> → <b>Cadastrar música</b> e digite ou cole letra e cifra (acorde numa linha, letra na linha de baixo).</li>
 <li><b>Biblioteca</b> → <b>Novo pot-pourri</b>: adicione músicas, arraste pela alça ⠿ (ou use ▲▼), ajuste o tom de cada uma e escreva observações.</li>
 <li><b>Tocar pot-pourri</b>: todas as cifras em uma página. Use <b>Iniciar</b> para rolar sozinho e <b>Modo palco</b> para tocar ao vivo.</li></ol></div>
 <div class="card help"><h3>Atalhos de teclado</h3><p>Espaço pausa/continua · ↑ ↓ velocidade · → ← próxima/anterior · Esc sai do modo palco.</p></div>
 <div class="card help"><h3>Backup dos repertórios</h3><p>Os dados ficam só neste navegador. Em <b>Biblioteca → Exportar JSON</b> você baixa um arquivo com todas as músicas e pot-pourris. Guarde-o no Drive, e-mail ou pen drive. Para restaurar, ou levar para outro aparelho, use <b>Importar JSON</b>. Limpar os dados do navegador apaga tudo, então exporte de vez em quando.</p></div>
 <div class="card help"><h3>Instalar como aplicativo</h3><p><b>Computador (Chrome/Edge):</b> abra pelo endereço <code>http://localhost:8080</code> (use o arquivo <code>Iniciar-CifraMix.bat</code>) ou pelo endereço do site e clique no ícone de instalar na barra de endereço.<br><b>Android (Chrome):</b> menu ⋮ → <b>Instalar app</b>.<br><b>iPhone (Safari):</b> Compartilhar → <b>Adicionar à Tela de Início</b>.<br>A instalação no celular exige o app publicado em um endereço https (veja o LEIA-ME).</p></div>`;
});
})();
