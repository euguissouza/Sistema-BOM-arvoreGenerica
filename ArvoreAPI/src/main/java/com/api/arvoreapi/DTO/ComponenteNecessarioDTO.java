package com.api.arvoreapi.DTO;

import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
public class ComponenteNecessarioDTO {

    private String nome;
    private int quantidade;
    private BigDecimal precoUnitario;
    private BigDecimal subtotal;

    public ComponenteNecessarioDTO(
            String nome,
            Integer quantidade,
            BigDecimal precoUnitario,
            BigDecimal subtotal) {

        this.nome = nome;
        this.quantidade = quantidade;
        this.precoUnitario = precoUnitario;
        this.subtotal = subtotal;
    }
}

