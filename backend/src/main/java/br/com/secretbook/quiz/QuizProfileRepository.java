package br.com.secretbook.quiz;

import org.springframework.data.jpa.repository.JpaRepository;

public interface QuizProfileRepository extends JpaRepository<QuizProfile, String> {
}
