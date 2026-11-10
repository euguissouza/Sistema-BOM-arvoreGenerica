
package com.api.arvoreapi.Controller;

import com.api.arvoreapi.DTO.*;
import com.api.arvoreapi.Entity.Itens;
import com.api.arvoreapi.Entity.ItensComposicao;
import com.api.arvoreapi.service.ArvoreService;

import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "*")
public class ArvoreController {

    private final ArvoreService service;

    public ArvoreController(ArvoreService service) {
        this.service = service;
    }

    @GetMapping("/itens")
    public List<Itens> listarItens() {
        return service.listarItens();
    }


    @PostMapping("/itens")
    public Itens criarItem(@RequestBody ItemDTO dto) {
        return service.salvaItem(dto);
    }


    @PutMapping("/itens/{id}/preco")
    public Itens atualizarPreco(
            @PathVariable Integer id,
            @RequestParam BigDecimal preco) {

        return service.atualizaPreco(id, preco);
    }

    @GetMapping("/composicoes")
    public List<ItensComposicao> listarComposicoes() {
        return service.listarComposicoes();
    }


    @PostMapping("/composicoes")
    public ItensComposicao adicionarComposicao(
            @RequestBody ComposicaoDTO dto) {

        return service.adicionarComposicao(dto);
    }

    @GetMapping("/produtos/{id}/estrutura")
    public List<String> estrutura(@PathVariable Integer id) {
        return service.estrutura(id);
    }


    @GetMapping("/produtos/{id}/producao")
    public ResultadoProduçãoDTO producao(
            @PathVariable Integer id,
            @RequestParam int quantidade) {

        return service.producao(id, quantidade);
    }

    @GetMapping("/produtos/{id}/custo")
    public BigDecimal custo(@PathVariable Integer id) {
        return service.custoProduto(id);
    }

    @GetMapping("/itens/{id}/implosao")
    public List<Impacto> implosao(@PathVariable Integer id) {
        return service.implosao(id);
    }
}
