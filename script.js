const board = document.querySelector('.board');
const blockHeight = 30;
const blockWeidth = 30;

const cols = Math.floor(board.clientWidth / blockWeidth);
const rows = Math.floor(board.clientHeight / blockHeight);


for(let i=0; i < rows * cols; i++){
    const blocks = document.createElement('div');
    blocks.classList.add('blocks');
    board.appendChild(blocks);
}
