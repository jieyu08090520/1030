// 全域變數
let quizTable;       // 儲存 CSV 載入的 p5.Table 物件
let questions = [];  // 儲存轉換後的題目物件陣列
let currentQ = 0;    // 目前題目索引
let score = 0;       // 學生分數
let quizState = 'quiz'; // 測驗狀態: 'quiz', 'result'

// --- 游標及特效相關變數 ---
let cursorEffectParticles = []; // 游標特效粒子陣列
let correctBlink = 0; // 正確答案閃爍計數器

// 在 setup() 之前載入 CSV 檔案
function preload() {
  // 'csv': 檔案格式, 'header': 檔案包含標頭行
  quizTable = loadTable('questions.csv', 'csv', 'header');
}

function setup() {
  createCanvas(windowWidth,windowHeight);
  background(220);
  textSize(24);
  textAlign(CENTER, CENTER);
  
  // 將 p5.Table 轉換為更容易操作的物件陣列
  if (quizTable) {
    for (let r = 0; r < quizTable.getRowCount(); r++) {
      let row = quizTable.getRow(r);
      questions.push({
        question: row.getString('question'),
        options: [
          { text: row.getString('optA'), key: 'A' },
          { text: row.getString('optB'), key: 'B' },
          { text: row.getString('optC'), key: 'C' }
        ],
        answer: row.getString('answer'),
        userAnswer: null
      });
    }
  }
}

function draw() {
  background(51); // 深色背景

  // 1. 游標特效
  drawCursorEffect();
  
  if (quizState === 'quiz') {
    // 2. 測驗畫面
    drawQuiz();
    
  } else if (quizState === 'result') {
    // 3. 結果畫面
    drawResult();
  }
}

// ----------------------------------------------------------------
// --- 繪圖函式 ---
// ----------------------------------------------------------------

function drawQuiz() {
  if (currentQ >= questions.length) {
    // 如果題目已答完，切換到結果畫面
    calculateScore();
    quizState = 'result';
    return;
  }
  
  let q = questions[currentQ];
  let optionHeight = 60;
  let startY = 200;
  let padding = 15;
  
  // 顯示題目
  fill(255);
  textSize(30);
  text(`第 ${currentQ + 1} 題: ${q.question}`, width / 2, 80);
  
  textSize(24);
  
  // 顯示選項
  for (let i = 0; i < q.options.length; i++) {
    let opt = q.options[i];
    let x = width / 2 - 200;
    let y = startY + i * (optionHeight + padding);
    let w = 400;
    let h = optionHeight;
    
    // 檢查滑鼠是否在選項上方
    let isHover = mouseX > x && mouseX < x + w && mouseY > y && mouseY < y + h;
    
    // 選項框體
    noStroke();
    if (isHover) {
      fill(100, 150, 255); // 特效: 懸停時變色
      cursor(HAND);       // 特效: 改變游標樣式
    } else {
      fill(70, 70, 70);
      cursor(ARROW);
    }
    
    // 選項選中特效 (作答後閃爍)
    if (q.userAnswer === opt.key && correctBlink > 0) {
      // 答案閃爍特效 (綠色表示作答)
      let b = map(sin(frameCount * 0.2), -1, 1, 100, 255); 
      fill(0, b, 0); 
    }
    
    rect(x, y, w, h, 10); // 圓角矩形
    
    // 選項文字
    fill(255);
    textAlign(LEFT, CENTER);
    text(`${opt.key}. ${opt.text}`, x + 20, y + h / 2);
  }
  
  textAlign(CENTER, CENTER); // 恢復置中
  
  // 更新閃爍計數器
  if (correctBlink > 0) {
    correctBlink--;
  }
}

function drawResult() {
  let finalScore = calculateScore();
  let msg = "";
  
  // 根據成績產生不同的動態畫面
  if (finalScore === questions.length) {
    msg = "💯 完美! 全部答對! 恭喜你! 🎉";
    drawPraiseAnimation(); // 稱讚動畫
  } else if (finalScore >= questions.length * 0.7) {
    msg = `👍 成績優異! 獲得 ${finalScore} 分! 繼續保持!`;
    drawGoodAnimation(); // 良好動畫
  } else {
    msg = `💪 需要再加油! 獲得 ${finalScore} 分。下次會更好!`;
    drawEncourageAnimation(); // 鼓勵動畫
  }
  
  // 顯示成績和訊息
  fill(255);
  textSize(40);
  text("測驗結果", width / 2, 100);
  textSize(28);
  text(msg, width / 2, 180);
  
  // 顯示分數
  textSize(60);
  fill(255, 200, 0);
  text(`總分: ${finalScore}/${questions.length}`, width / 2, height / 2);
  
  // 重來按鈕
  drawRestartButton();
}

function drawRestartButton() {
  let x = width / 2;
  let y = height * 0.75;
  let w = 150;
  let h = 50;
  
  let isHover = mouseX > x - w/2 && mouseX < x + w/2 && mouseY > y - h/2 && mouseY < y + h/2;
  
  if (isHover) {
    fill(255, 100, 100);
    cursor(HAND);
  } else {
    fill(200, 50, 50);
  }
  
  rect(x - w/2, y - h/2, w, h, 8);
  
  fill(255);
  textSize(24);
  text("重來一次", x, y);
}

// ----------------------------------------------------------------
// --- 動畫特效函式 ---
// ----------------------------------------------------------------

// --- 游標粒子特效 (游標移動時產生的小亮點) ---
function drawCursorEffect() {
  // 每幀新增一個粒子
  cursorEffectParticles.push(new Particle(mouseX, mouseY));
  
  // 繪製並更新粒子
  for (let i = cursorEffectParticles.length - 1; i >= 0; i--) {
    let p = cursorEffectParticles[i];
    p.update();
    p.show();
    if (p.finished()) {
      cursorEffectParticles.splice(i, 1); // 移除死亡粒子
    }
  }
}

class Particle {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.vx = random(-1, 1);
    this.vy = random(-1, 1);
    this.alpha = 255;
    this.size = random(3, 8);
    this.color = color(255, 255, 150); // 淡黃色
  }
  
  finished() {
    return this.alpha < 0;
  }
  
  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.alpha -= 5; // 逐漸消失
  }
  
  show() {
    noStroke();
    this.color.setAlpha(this.alpha);
    fill(this.color);
    ellipse(this.x, this.y, this.size);
  }
}

// --- 成績優秀動畫: 稱讚/禮花動畫 ---
function drawPraiseAnimation() {
  // 簡單的彩色圓圈禮花效果
  let c = color(random(255), random(255), random(255));
  c.setAlpha(150);
  fill(c);
  noStroke();
  
  // 從中心向外擴散的圓圈
  let size = (frameCount * 2) % width;
  let alpha = map(size, 0, width, 255, 0);
  c.setAlpha(alpha);
  fill(c);
  ellipse(width / 2, height / 2, size, size);
  
  // 讓多個圓圈出現，增加動態感
  let size2 = (frameCount * 1.5 + 100) % width;
  let alpha2 = map(size2, 0, width, 200, 0);
  let c2 = color(255, 100, 100);
  c2.setAlpha(alpha2);
  fill(c2);
  ellipse(width / 2, height / 2, size2, size2);
}

// --- 成績良好動畫 ---
function drawGoodAnimation() {
    // 簡單的上升氣泡效果
    for (let i = 0; i < 5; i++) {
        let x = width * (i + 1) / 6;
        let y = (frameCount * 2 + i * 50) % height; // 向上移動
        let alpha = map(y, 0, height, 255, 0);
        
        let c = color(150, 200, 255);
        c.setAlpha(alpha);
        fill(c);
        noStroke();
        ellipse(x, height - y, 20 + sin(frameCount * 0.1) * 10);
    }
}

// --- 鼓勵動畫: 下次會更好 ---
function drawEncourageAnimation() {
  // 簡單的心跳效果
  let scale = map(sin(frameCount * 0.1), -1, 1, 0.8, 1.2); // 心跳大小變化
  let h_size = 100 * scale;
  
  fill(255, 50, 50); // 紅色
  noStroke();
  
  // 簡單的心形繪製
  push();
  translate(width / 2, height / 2 + 100);
  rotate(PI / 4);
  rect(0, 0, h_size, h_size); // 菱形
  ellipse(0, -h_size / 2, h_size, h_size); // 左上角圓形
  ellipse(-h_size / 2, 0, h_size, h_size); // 右上角圓形
  pop();
  
  fill(255);
  textSize(20);
  text("Keep going!", width/2, height/2 + 200);
}

// ----------------------------------------------------------------
// --- 互動函式 ---
// ----------------------------------------------------------------

function mousePressed() {
  if (quizState === 'quiz') {
    handleQuizClick();
  } else if (quizState === 'result') {
    handleResultClick();
  }
}

function handleQuizClick() {
  if (currentQ >= questions.length) return;
  
  let q = questions[currentQ];
  let optionHeight = 60;
  let startY = 200;
  let padding = 15;
  
  for (let i = 0; i < q.options.length; i++) {
    let opt = q.options[i];
    let x = width / 2 - 200;
    let y = startY + i * (optionHeight + padding);
    let w = 400;
    let h = optionHeight;
    
    // 檢查滑鼠是否點擊在選項上
    if (mouseX > x && mouseX < x + w && mouseY > y && mouseY < y + h) {
      q.userAnswer = opt.key; // 紀錄作答
      correctBlink = 30; // 啟動選中特效
      
      // 延遲後跳轉到下一題
      setTimeout(() => {
        currentQ++;
      }, 500); // 0.5 秒延遲
      
      return; // 處理完畢
    }
  }
}

function handleResultClick() {
  let x = width / 2;
  let y = height * 0.75;
  let w = 150;
  let h = 50;
  
  // 檢查是否點擊重來按鈕
  if (mouseX > x - w/2 && mouseX < x + w/2 && mouseY > y - h/2 && mouseY < y + h/2) {
    // 重設測驗狀態
    currentQ = 0;
    score = 0;
    quizState = 'quiz';
    
    // 清空用戶答案
    for(let q of questions) {
      q.userAnswer = null;
    }
  }
}

// ----------------------------------------------------------------
// --- 邏輯函式 ---
// ----------------------------------------------------------------

function calculateScore() {
  let finalScore = 0;
  for (let q of questions) {
    if (q.userAnswer === q.answer) {
      finalScore++;
    }
  }
  return finalScore;
}