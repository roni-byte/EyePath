package com.eyepath.project.repository;

import com.eyepath.project.model.StudyInfo;
import com.eyepath.project.model.StudyPhoto;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface StudyPhotoRepository extends JpaRepository<StudyPhoto, Integer> {
    List<StudyPhoto> findByStudyOrderByPhotoOrder(StudyInfo test);
}
