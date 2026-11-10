package com.api.arvoreapi.DTO;

import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;


@Getter
@Setter
public class ItemDTO {
    String nome;
    BigDecimal preco;
}
