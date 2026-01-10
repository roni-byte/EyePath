package com.eyepath.project.repository;

import com.eyepath.project.model.Photo;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PhotoRepository extends JpaRepository<Photo, Integer> {
    Optional<Photo> findByHash(String hash);
}
