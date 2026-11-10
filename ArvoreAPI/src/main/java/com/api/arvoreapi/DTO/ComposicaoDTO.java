package com.api.arvoreapi.DTO;

import com.api.arvoreapi.Entity.Itens;
import lombok.Getter;
import lombok.Setter;


@Getter
@Setter
public class ComposicaoDTO {
    private Itens pai;

    private Itens filho;

    private int quant;
}
