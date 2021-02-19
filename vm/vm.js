// r0, r1, r2, r3
let regs = [0, 0, 0, 0];

let stack = [];

let program = [];

let pc = 0;

let halted = false;

function init(prg) {
    program = prg;

    pc = 0;
    halted = false;
    stack = [];
}

function run() {
    while (!halted) {
        runone();
    }
}

function runone() {
    if (halted)
        return;

    let instr = program[pc],
        rdst, rsrc, val, addr, r1, r2, reg;

    switch (instr) {
        // movr rdst, rsrc
        case 10:
            pc++;
            rdst = program[pc++];
            rsrc = program[pc++];
            regs[rdst] = regs[rsrc];
            break;

            // movv rdst, val
        case 11:
            pc++;
            rdst = program[pc++];
            val = program[pc++];
            regs[rdst] = val;
            break;

            // add rdst, rsrc
        case 20:
            pc++;
            rdst = program[pc++];
            rsrc = program[pc++];
            regs[rdst] += regs[rsrc];
            break;

            // sub rdst, rsrc
        case 21:
            pc++;
            rdst = program[pc++];
            rsrc = program[pc++];
            regs[rdst] -= regs[rsrc];
            break;

            // push rsrc
        case 30:
            pc++;
            rsrc = program[pc++];
            stack.push(regs[rsrc]);
            break;

            // pop rdst
        case 31:
            pc++;
            rdst = program[pc++];
            regs[rdst] = stack.pop();
            break;

            // jp addr
        case 40:
            pc++;
            addr = program[pc++];
            pc = addr;
            break;

            // jl r1, r2, addr
        case 41:
            pc++;
            r1 = program[pc++];
            r2 = program[pc++];
            addr = program[pc++];
            if (regs[r1] < regs[r2])
                pc = addr
            break;

            // call addr
        case 42:
            pc++;
            addr = program[pc++];
            stack.push(pc);
            pc = addr;
            break;

            // ret
        case 50:
            pc++;
            addr = stack.pop();
            pc = addr;
            break;

            // print reg
        case 60:
            pc++;
            reg = program[pc++];
            println(regs[reg]);
            break;

            // halt
        case 255:
            pc++;
            halted = true;
            break;

        default:
            println("Error in bytecode, instr unknown:", +instr);
            halted = true;
            break;
    }

    if (pc >= program.length) {
        halted = true;
    }

}

function println(txt) {
    console.log(txt)
}

module.exports = {
    init,
    run
}