import { Component, OnInit, Input, ViewChild, Inject } from '@angular/core';
import { Dish } from '../shared/dish';
import { DishService } from '../services/dish.service';

import { Params, ActivatedRoute } from '@angular/router';
import { Location } from '@angular/common';
import { switchMap } from 'rxjs/operators';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatSliderModule } from '@angular/material/slider';
import { Comment } from '../shared/comment'
import { visibility, flyInOut, expand } from '../animations/app.animation';

@Component({
  selector: 'app-dishdetail',
  templateUrl: './dishdetail.component.html',
  styleUrls: ['./dishdetail.component.scss'],
  host: {
  '[@flyInOut]': 'true',
  'style': 'display: block;'
  },
  animations: [visibility(), flyInOut(), expand()]
})
export class DishdetailComponent implements OnInit {
  
  visibility = 'shown';
  dish: Dish;
  dishcopy: Dish;
  dishIds: string[];
  prev: string;
  next: string;
  errMess: string;
  feedbackForm: FormGroup;
  commentfeedback: {
	rating: number;
    comment: string;
    author: string;
    date: string;
  }
  
  formErrors = {
    'author': 'Name',
    'comment': 'Your Comment'
  };

  validationMessages = {
    'author': {
      'required':      'Author Name is required.',
      'minlength':     'Author Name must be at least 2 characters long.',
    },
    'comment': {
      'required':      'Feedback is required.',
    },
  };
  
  @ViewChild('fform') feedbackFormDirective;

  constructor(private dishservice: DishService,
    private route: ActivatedRoute,
    private location: Location,
	private fb: FormBuilder, @Inject('BaseURL') private baseURL) { this.createForm(); }

  ngOnInit() {
    this.dishservice.getDishIds().subscribe(dishIds => this.dishIds = dishIds);
    this.route.params.pipe(switchMap((params: Params) => { this.visibility = 'hidden'; return this.dishservice.getDish(+params['id']); }))
    .subscribe(dish => { this.dish = dish; this.dishcopy = dish; this.setPrevNext(dish.id); this.visibility = 'shown'; },
      errmess => this.errMess = <any>errmess);
	
  }
  
  createForm() {
    this.feedbackForm = this.fb.group({
      rating: ['5'],
	  author: ['', [Validators.required, Validators.minLength(2)] ],
      comment: ['', [Validators.required] ],
	  date: ''
    });
	
    this.feedbackForm.valueChanges
      .subscribe(data => this.onValueChanged(data));

    this.onValueChanged(); // (re)set validation messages now
  }
  
  onValueChanged(data?: any) {

	if (!this.feedbackForm) { return; }
    const form = this.feedbackForm;
    for (const field in this.formErrors) {
      if (this.formErrors.hasOwnProperty(field)) {
        // clear previous error message (if any)
        this.formErrors[field] = '';
        const control = form.get(field);
        if (control && control.dirty && !control.valid) {
          const messages = this.validationMessages[field];
          for (const key in control.errors) {
            if (control.errors.hasOwnProperty(key)) {
              this.formErrors[field] += messages[key] + ' ';
            }
          }
        }
      }
    }
  }
  
  setPrevNext(dishId: string) {
    const index = this.dishIds.indexOf(dishId);
    this.prev = this.dishIds[(this.dishIds.length + index - 1) % this.dishIds.length];
    this.next = this.dishIds[(this.dishIds.length + index + 1) % this.dishIds.length];
  }
  
  onSubmit() {
    this.commentfeedback = this.feedbackForm.value;
	//this.commentfeedback.date = Date.now().toISOString();
    //console.log(this.commentfeedback);
    psd_comment: Comment;
	psd_comment.rating: this.commentfeedback.rating;
	psd_comment.comment: this.commentfeedback.comment;
	psd_comment.author: this.commentfeedback.author;
	psd_comment.date: Date.now();
	
	this.dishcopy.comments.push(psd_comment);
	
    this.dishservice.putDish(this.dishcopy)
      .subscribe(dish => {
        this.dish = dish; this.dishcopy = dish;
      },
      errmess => { this.dish = null; this.dishcopy = null; this.errMess = <any>errmess; });
	  
	this.feedbackFormDirective.resetForm();
	this.feedbackForm.reset({
      name: '',
      comment: '',
	  rating: '5'
    });
  }
  
  goBack(): void {
    this.location.back();
  }

}
