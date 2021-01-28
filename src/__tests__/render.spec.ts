import { render, renderSync } from '../render'

describe('render: tests', () => {
    test('render', () => {
        render({ filename:__dirname+'/scss/basic.scss'},(err,res)=>{
            if(res){
                expect(res.code).toMatchSnapshot()
            }
        })
    })
    test('renderSync', () => {
        const res = renderSync({ filename: __dirname+'/scss/basic.scss'})
        expect(res.code).toMatchSnapshot()
    })
})