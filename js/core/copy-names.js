// Copie commune aux objets, composants et runes, y compris après un nouveau rendu.
function itemNameHTML(name,copyName=name){
 if(!String(name??''))return '';
 return `<span class="copy-name" data-copy-name="${esc(copyName)}" role="button" tabindex="0" aria-label="Copier le nom : ${esc(copyName)}" title="Copier le nom">${esc(name)}</span>`;
}
let nameCopySequence=0;
async function copyItemName(button){
 const name=button.dataset.copyName;if(!name)return false;
 const sequence=String(++nameCopySequence);button.dataset.copySequence=sequence;
 let copied=false;
 try{await navigator.clipboard.writeText(name);copied=true}catch{
  // Repli pour les navigateurs qui ne proposent pas Clipboard API sur une page locale.
  if(typeof document.execCommand==='function'){
   const field=document.createElement('textarea'),focused=document.activeElement;
   field.value=name;field.readOnly=true;field.tabIndex=-1;field.setAttribute('aria-hidden','true');field.style.cssText='position:fixed;left:-10000px;top:0';
   // Un champ ajouté dans la modale reste sélectionnable lorsque celle-ci est ouverte.
   const parent=button.closest('dialog')||document.body;parent.append(field);
   try{field.select();copied=document.execCommand('copy')}catch{}finally{field.remove();focused?.focus?.({preventScroll:true})}
  }
 }
 if(button.dataset.copySequence!==sequence)return copied;
 button.dataset.copyState=copied?'copied':'error';button.title=copied?'Copié !':'Copie indisponible : sélectionne le nom et utilise Ctrl+C';
 button.setAttribute?.('aria-label',copied?'Nom copié : '+name:'Copie indisponible : '+name);
 setTimeout(()=>{if(button.dataset.copySequence!==sequence)return;delete button.dataset.copyState;button.title='Copier le nom';button.setAttribute?.('aria-label','Copier le nom : '+name)},2200);
 return copied;
}
function handleCopyName(event){
 const button=event.target.closest?.('[data-copy-name]');if(!button)return;
 if(event.type==='keydown'&&!['Enter',' '].includes(event.key))return;
 if(event.type==='keydown'&&event.repeat){event.preventDefault();return}
 event.preventDefault();event.stopPropagation();void copyItemName(button);
}
if(typeof document!=='undefined'&&typeof document.addEventListener==='function'){
 document.addEventListener('click',handleCopyName,true);
 document.addEventListener('keydown',handleCopyName,true);
}
