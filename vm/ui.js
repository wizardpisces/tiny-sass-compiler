var txtCode;
var txtBytes;
var txtOutput;
var btnInfo;
var btnAsm;
var btnRun;
var btnClear;

var txtInfo;
var btnClose;

var info = `
INTRODUCTION
============

This Virtual Machine is a fantasy one. It doesn't exist in the real world, but it mimics very closely how a real CPU works.

The machine has 4 general purpose number registers: R0, R1, R2, R3 (Think of this registers as variables that can store a number). Besides these registers, the machine has also a stack with ability to push or pop values on and out of the stack.

The machine operates by instructions. Since it is a simplified machine it has only the following instructions. Some of the instructions don't have operands, while other instructions have several operands.

A series of instructions, make our VM program. Instructions are encoded in the program as this:

INSTRUCTION1 [OPERAND1] [OPERAND2] [OPERAND3] INSTRUCTION2 [OPERAND1] ...

Each instruction has a unique number associated with it. For simplicity, instruction codes, operands and even addresses are regular numbers. Therefore no bytes, or any other data types are needed. Everything is a number!

Our program is therefore a series of numbers. Each number ocupies a single cell of memory. For example an instruction with 3 operands will take 4 cells of program memory (1 for the instruction code and 3 for operands).

INSTRUCTIONS
============

And now let's see the set of the instructions that our VM accepts (note: under each instruction is specified the number used to encode that particular instruction. Also registers R0, R1, R2, R3 are encoded as numbers 0, 1, 2, 3):

Loads the value from reg_src into reg_dst. E.g. reg_dst = reg_src
MOVR reg_dst, reg_src
MOVR = 10

Loads the numeric value into register reg_dst. E.g. reg_dst = value
MOVV reg_dst, value
MOVV = 11

Adds the value from reg_src to the value of reg_dst and store the result in reg_dst
ADD reg_dst, reg_src
ADD = 20

Substracts the value of reg_src from the value of reg_dst and store the result in reg_dst
SUB reg_dst, reg_src
SUB = 21

Pushes the value of reg_src on the stack
PUSH reg_src
PUSH = 30

Pops the last value from stack and loads it into register reg_dst
POP reg_dst
POP = 31

Jumps the execution to address addr. Similar to a GOTO!
JP addr
JP = 40

Jump to the address addr only if the value from reg_1 < reg_2 (IF reg_1 < reg_2 THEN JP addr)
JL reg_1, reg_2, addr
JL = 41

Pushes onto the stack the address of instruction that follows CALL and then jumps to address addr
CALL addr
CALL = 42

Pops from the stack the last number, assumes is an address and jump to that address
RET
RET = 50

Print on the screen the value contained in the register reg
PRINT reg
PRINT = 60

Stops our VM. The virtual CPU doesn't execute instructions once HALT is encountered.
HALT
HALT = 255
`

export function createUI(code, fnAssemble, fnRun) {
    background('PapayaWhip');
    fill(0);
    noStroke();

    // display the main title
    push();
    fill("Tan");
    rect(10, 10, 780, 40);
    fill("Black");
    textSize(25);
    text("Virtual Machine implementation in JavaScript", 10, 39);
    pop();

    text("Code in Assembler", 10, 75);
    text("Input program and press Assemble", 10, 545);
    txtCode = createEdit(10, 80, 280, 450);
    txtCode.text = code;
    txtCode.onchange = function () {
        txtBytes.text = "";
        txtOutput.text = "";
    };

    text("Bytecode", 310, 75);
    text("Press run to run bytecode. You can also edit.", 310, 545);
    txtBytes = createEdit(310, 80, 241, 450);

    text("Program Output", 570, 75);
    txtOutput = createEdit(570, 80, 221, 450);
    txtOutput.readonly = true;

    btnInfo = createButton(10, 570, 70, 22);
    btnInfo.text = "Info";
    btnInfo.onclick = btnInfo_onClick;

    btnAsm = createButton(210, 570, 80, 22);
    btnAsm.text = "Assemble";
    btnAsm.onclick = function () {
        txtBytes.text = fnAssemble(txtCode.text);
    };

    btnRun = createButton(480, 570, 70, 22);
    btnRun.text = "⚡ Run";
    btnRun.onclick = function () {
        fnRun(txtBytes.text, txtOutput);
    };

    btnClear = createButton(720, 570, 70, 22);
    btnClear.text = "Clear";
    btnClear.onclick = function () {
        txtOutput.text = "";
    };

    txtInfo = createEdit(10, 60, 780, 490);
    txtInfo.text = info;
    txtInfo.readonly = true;
    txtInfo.visible = false;

    btnClose = createButton(360, 570, 70, 22);
    btnClose.text = "Close";
    btnClose.onclick = btnClose_onClick;
    btnClose.visible = false;
}

function btnInfo_onClick() {
    txtCode.visible = false;
    txtBytes.visible = false;
    txtOutput.visible = false;
    btnInfo.visible = false;
    btnAsm.visible = false;
    btnRun.visible = false;
    btnClear.visible = false;

    txtInfo.visible = true;
    btnClose.visible = true;
}

function btnClose_onClick() {
    txtInfo.visible = false;
    btnClose.visible = false;

    txtCode.visible = true;
    txtBytes.visible = true;
    txtOutput.visible = true;
    btnInfo.visible = true;
    btnAsm.visible = true;
    btnRun.visible = true;
    btnClear.visible = true;
}
