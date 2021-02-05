// r0, r1, r2, r3
var regs = [0, 0, 0, 0];

var stack = [];

var program = [];

var pc = 0;

var halted = false;

var txtOutput = null;

function init(prg, txtOut) {
    program = prg;
    txtOutput = txtOut;

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

    var instr = program[pc];

    switch (instr) {
        // movr rdst, rsrc
        case 10:
            pc++;
            var rdst = program[pc++];
            var rsrc = program[pc++];
            regs[rdst] = regs[rsrc];
            break;

            // movv rdst, val
        case 11:
            pc++;
            var rdst = program[pc++];
            var val = program[pc++];
            regs[rdst] = val;
            break;

            // add rdst, rsrc
        case 20:
            pc++;
            var rdst = program[pc++];
            var rsrc = program[pc++];
            regs[rdst] += regs[rsrc];
            break;

            // sub rdst, rsrc
        case 21:
            pc++;
            var rdst = program[pc++];
            var rsrc = program[pc++];
            regs[rdst] -= regs[rsrc];
            break;

            // push rsrc
        case 30:
            pc++;
            var rsrc = program[pc++];
            stack.push(regs[rsrc]);
            break;

            // pop rdst
        case 31:
            pc++;
            var rdst = program[pc++];
            regs[rdst] = stack.pop();
            break;

            // jp addr
        case 40:
            pc++;
            var addr = program[pc++];
            pc = addr;
            break;

            // jl r1, r2, addr
        case 41:
            pc++;
            var r1 = program[pc++];
            var r2 = program[pc++];
            var addr = program[pc++];
            if (regs[r1] < regs[r2])
                pc = addr
            break;

            // call addr
        case 42:
            pc++;
            var addr = program[pc++];
            stack.push(pc);
            pc = addr;
            break;

            // ret
        case 50:
            pc++;
            var addr = stack.pop();
            pc = addr;
            break;

            // print reg
        case 60:
            pc++;
            var reg = program[pc++];
            println(regs[reg]);
            break;

            // halt
        case 255:
            pc++;
            halted = true;
            break;

        default:
            println("Error in bytecode");
            halted = true;
            break;
    }

    if (pc >= program.length) {
        halted = true;
    }

}

function println(txt) {
    if (txtOutput)
        txtOutput.text += txt + "\n";
}
