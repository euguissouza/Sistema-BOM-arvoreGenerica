package com.api.arvoreapi.Entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import lombok.ToString;

@Entity
@Table(name = "itensComposicao")
@Getter
@Setter
@ToString
public class ItensComposicao {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @ManyToOne
    private Itens pai;

    @ManyToOne
    private Itens filho;

    private int quant;
}
