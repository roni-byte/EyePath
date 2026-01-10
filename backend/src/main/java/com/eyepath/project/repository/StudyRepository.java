package com.eyepath.project.repository;

import com.eyepath.project.model.StudyInfo;
import org.springframework.data.jpa.repository.JpaRepository;

public interface StudyRepository extends JpaRepository<StudyInfo, Integer> {

}
