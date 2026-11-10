package com.api.arvoreapi.repository;

import com.api.arvoreapi.Entity.Itens;
import com.api.arvoreapi.Entity.ItensComposicao;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ItensRepository extends JpaRepository<Itens, Integer> {
    List<ItensComposicao> findByPai(Itens pai);
    List<ItensComposicao>  findByFilho(Itens filho);
}
