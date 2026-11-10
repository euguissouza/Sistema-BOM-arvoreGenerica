package com.api.arvoreapi.DTO;


import java.math.BigDecimal;

public record Impacto(
        String produto,
        BigDecimal custo) {
}
