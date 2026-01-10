package com.eyepath.project.repository;

import com.eyepath.project.model.ClientResult;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ClientResultRepository extends JpaRepository<ClientResult, Integer> {
    List<ClientResult> findByStudy_Id(Integer studyId);
}
